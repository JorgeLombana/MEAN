import Task from '../models/taskModel.js';
import mongoose from 'mongoose';

/**
 * Repository class for handling database operations related to Tasks.
 * Provides an abstraction layer over direct Mongoose calls.
 */
class TaskRepository {
  /**
   * Creates a new task in the database.
   * @param {object} taskData - The data for the new task, matching the Task schema.
   * @returns {Promise<object>} The created task document (Mongoose document).
   */
  async create(taskData) {
    const task = new Task(taskData);
    return await task.save();
  }

  /**
   * Finds all tasks matching the filter criteria, with options for sorting, pagination, and field selection.
   * @param {object} [filter={}] - MongoDB filter object.
   * @param {object} [options={}] - Options for the query.
   * @param {object} [options.sort={ dueDate: 1 }] - Sort order (e.g., { dueDate: 1, priority: -1 }).
   * @param {number} [options.skip=0] - Number of documents to skip for pagination.
   * @param {number} [options.limit=10] - Maximum number of documents to return.
   * @param {string} [options.select=null] - Space-separated string of fields to include or exclude (e.g., 'title description -history').
   * @returns {Promise<object[]>} A list of plain JavaScript task objects (due to .lean()).
   */
  async findAll(filter = {}, options = {}) {
    const {
      sort = { dueDate: 1 }, // Default sort: dueDate ascending
      skip = 0,
      limit = 10, // Default page size
      select = null,
    } = options;

    let query = Task.find(filter);

    if (select) query = query.select(select);
    if (sort && Object.keys(sort).length > 0) query = query.sort(sort);

    // Ensure skip and limit are valid numbers
    const numSkip = Number(skip);
    const numLimit = Number(limit);

    if (!isNaN(numSkip) && numSkip >= 0) query = query.skip(numSkip);
    if (!isNaN(numLimit) && numLimit > 0) query = query.limit(numLimit);

    return await query.lean().exec(); // .lean() for performance, .exec() to return a true Promise
  }

  /**
   * Finds a single task by its ID.
   * @param {string} id - The MongoDB ObjectId of the task.
   * @returns {Promise<object|null>} The task document (Mongoose document) or null if not found or ID is invalid.
   */
  async findById(id) {
    if (!mongoose.isValidObjectId(id)) {
      return null; // Invalid ID format
    }
    return await Task.findById(id).exec();
  }

  /**
   * Updates a task by its ID using `findById` and `save()`.
   * This approach ensures that Mongoose pre-save middleware (e.g., for history tracking) is triggered.
   * @param {string} id - The ID of the task to update.
   * @param {object} updateData - An object containing the fields to update.
   * @returns {Promise<object|null>} The updated task document (Mongoose document) or null if not found or ID is invalid.
   */
  async updateById(id, updateData) {
    if (!mongoose.isValidObjectId(id)) {
      return null;
    }

    const task = await Task.findById(id).exec(); // Fetch the full Mongoose document
    if (!task) {
      return null; // Task not found
    }

    // Apply updates to the document instance
    Object.keys(updateData).forEach((key) => {
      // Avoid directly overwriting history array or managed fields like _id, __v
      if (key !== 'history' && key !== '_id' && key !== '__v' && key !== 'createdAt' && key !== 'updatedAt') {
        task[key] = updateData[key];
      }
    });

    return await task.save(); // Triggers pre-save middleware and validations
  }

  /**
   * Deletes a task by its ID.
   * @param {string} id - The ID of the task to delete.
   * @returns {Promise<object|null>} The deleted task document (plain object due to findByIdAndDelete default) or null if not found or ID is invalid.
   */
  async deleteById(id) {
    if (!mongoose.isValidObjectId(id)) {
      return null;
    }
    // findByIdAndDelete returns the document as it was before deletion.
    return await Task.findByIdAndDelete(id).exec();
  }

  /**
   * Counts the number of documents matching the given filter.
   * @param {object} [filter={}] - MongoDB filter object.
   * @returns {Promise<number>} The total count of matching documents.
   */
  async countDocuments(filter = {}) {
    return await Task.countDocuments(filter).exec();
  }

  /**
   * Finds tasks using a text search term across indexed text fields (if configured in schema) or regex for broader search.
   * @param {string} searchTerm - The term to search for.
   * @param {object} [additionalFilter={}] - Additional MongoDB filter criteria to apply.
   * @returns {Promise<object[]>} A list of matching task objects (due to .lean()).
   */
  async findWithTextSearch(searchTerm, additionalFilter = {}) {
    // This regex search is flexible but might be less performant than MongoDB's $text operator for large datasets.
    // Ensure `taskSchema.index({ title: 'text', description: 'text' });` is active for $text search.
    // If using $text:
    // const textSearchFilter = { ...additionalFilter, $text: { $search: searchTerm } };
    // return await Task.find(textSearchFilter).lean().exec();

    // Current regex implementation:
    const searchRegex = new RegExp(searchTerm, 'i'); // Case-insensitive
    const searchFilter = {
      ...additionalFilter,
      $or: [
        { title: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
        { tags: { $regex: searchRegex } }, // Matches if any tag in the array contains the searchTerm
      ],
    };

    return await Task.find(searchFilter).lean().exec();
  }

  /**
   * Retrieves aggregated statistics about tasks.
   * Includes counts for total tasks, and breakdowns by status, priority, and overdue status.
   * @returns {Promise<object[]>} An array containing the aggregated statistics object (typically one element).
   */
  async getStatistics() {
    return await Task.aggregate([
      {
        $group: {
          _id: null, // Group all documents together
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
          overdue: {
            $sum: {
              $cond: [
                // Condition: dueDate is in the past AND status is not 'Completed'
                {
                  $and: [{ $lt: ['$dueDate', new Date()] }, { $ne: ['$status', 'Completed'] }],
                },
                1, // If true, add 1 to sum
                0, // If false, add 0
              ],
            },
          },
          highPriority: { $sum: { $cond: [{ $eq: ['$priority', 'High'] }, 1, 0] } },
          mediumPriority: { $sum: { $cond: [{ $eq: ['$priority', 'Medium'] }, 1, 0] } },
          lowPriority: { $sum: { $cond: [{ $eq: ['$priority', 'Low'] }, 1, 0] } },
        },
      },
      {
        $project: {
          // Optional: reshape the output, remove _id
          _id: 0,
          total: 1,
          pending: 1,
          inProgress: 1,
          completed: 1,
          overdue: 1,
          byPriority: {
            // Group priority counts
            high: '$highPriority',
            medium: '$mediumPriority',
            low: '$lowPriority',
          },
        },
      },
    ]).exec();
  }

  /**
   * Finds tasks within a given date range (inclusive of start and end dates).
   * @param {string|Date} [startDate] - The start of the date range (YYYY-MM-DD or Date object).
   * @param {string|Date} [endDate] - The end of the date range (YYYY-MM-DD or Date object).
   * @param {object} [additionalFilter={}] - Additional MongoDB filter criteria.
   * @returns {Promise<object[]>} A list of tasks within the date range, sorted by due date ascending.
   */
  async findByDateRange(startDate, endDate, additionalFilter = {}) {
    const dateFilterConditions = {};

    if (startDate) {
      const start = new Date(startDate);
      if (!isNaN(start.getTime())) {
        // Check if date is valid
        dateFilterConditions.$gte = start;
      }
    }
    if (endDate) {
      const end = new Date(endDate);
      if (!isNaN(end.getTime())) {
        // Check if date is valid
        end.setHours(23, 59, 59, 999); // Include the entire end day
        dateFilterConditions.$lte = end;
      }
    }

    const filter = { ...additionalFilter };
    if (Object.keys(dateFilterConditions).length > 0) {
      filter.dueDate = dateFilterConditions;
    }

    return await Task.find(filter).sort({ dueDate: 1 }).lean().exec();
  }

  /**
   * Finds tasks by a list of tags. Tags are normalized (trimmed, lowercased) before querying.
   * @param {string|string[]} tagsInput - A comma-separated string or an array of tags.
   * @param {object} [additionalFilter={}] - Additional MongoDB filter criteria.
   * @returns {Promise<object[]>} A list of tasks matching any of the provided tags.
   */
  async findByTags(tagsInput, additionalFilter = {}) {
    let normalizedTags = [];
    if (typeof tagsInput === 'string') {
      normalizedTags = tagsInput
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag.length > 0);
    } else if (Array.isArray(tagsInput)) {
      normalizedTags = tagsInput
        .map((tag) => (typeof tag === 'string' ? tag.trim().toLowerCase() : ''))
        .filter((tag) => tag.length > 0);
    }

    const filter = { ...additionalFilter };

    if (normalizedTags.length > 0) {
      filter.tags = { $in: normalizedTags }; // Matches tasks containing any of the normalized tags
    } else if (tagsInput !== undefined && normalizedTags.length === 0) {
      // If tagsInput was provided but resulted in no valid tags (e.g., empty string, array of empty strings),
      // this could mean "find tasks with no tags" or "no tag filter".
      // Current behavior: if no valid tags, this part of the filter is omitted.
      // To find tasks with empty 'tags' array: filter.tags = { $size: 0 } or { $eq: [] }
      // For now, if normalizedTags is empty, we don't add a tags filter from this function.
    }

    // If after processing tagsInput, normalizedTags is empty, and there's no additionalFilter,
    // this would effectively call Task.find({}).lean().exec(), returning all tasks.
    // This might be desired or might need adjustment based on specific requirements for empty tag searches.
    if (normalizedTags.length === 0 && Object.keys(additionalFilter).length === 0 && tagsInput !== undefined) {
      // If tags were specified but all were invalid/empty, and no other filters,
      // it's safer to return an empty array than all tasks, unless "all tasks" is the explicit goal.
      // For now, let it proceed, which means it will return all tasks if additionalFilter is also empty.
      // Consider: return [];
    }

    return await Task.find(filter).lean().exec();
  }
}

export default new TaskRepository();
