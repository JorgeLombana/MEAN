import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Task from '../src/models/taskModel.js';

dotenv.config();

const initializeDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('📦 Connected to MongoDB for initialization');

    // Clear existing data (optional)
    await Task.deleteMany({});
    console.log('🗑️  Cleared existing tasks');

    // Create sample tasks
    const sampleTasks = [
      {
        title: 'Setup project structure',
        description: 'Create the basic folder structure for the task management API',
        status: 'Completed',
        priority: 'High',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        tags: ['setup', 'backend', 'development']
      },
      {
        title: 'Implement authentication',
        description: 'Add user authentication and authorization',
        status: 'In Progress',
        priority: 'High',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        tags: ['security', 'auth', 'backend']
      },
      {
        title: 'Write unit tests',
        description: 'Create comprehensive unit tests for all endpoints',
        status: 'Pending',
        priority: 'Medium',
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
        tags: ['testing', 'quality', 'development']
      },
      {
        title: 'Design user interface',
        description: 'Create wireframes and mockups for the frontend',
        status: 'Pending',
        priority: 'Low',
        dueDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 28 days from now
        tags: ['frontend', 'design', 'ui']
      },
      {
        title: 'Database optimization',
        description: 'Optimize database queries and add proper indexing',
        status: 'Pending',
        priority: 'Medium',
        dueDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), // 35 days from now
        tags: ['database', 'performance', 'backend']
      }
    ];

    const createdTasks = await Task.insertMany(sampleTasks);
    console.log(`✅ Created ${createdTasks.length} sample tasks`);

    console.log('🎉 Database initialization completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
};

initializeDatabase();