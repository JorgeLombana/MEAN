# Task Management

A comprehensive, modern task management application built with the MEAN stack (MongoDB, Express.js, Angular 19, Node.js), featuring advanced task tracking, filtering, sorting, pagination, and complete history audit trails.

## 🚀 Features

### Core Functionality

- **Complete CRUD Operations**: Create, read, update, and delete tasks with full validation
- **Advanced Filtering**: Filter by status, priority, date ranges, tags, and text search
- **Smart Sorting**: Multi-field sorting capabilities (due date, priority, creation date)
- **Pagination**: Efficient data loading with configurable page sizes
- **Task History Tracking**: Complete audit trail of all task changes with timestamps
- **Priority Management**: Three-tier priority system (High, Medium, Low)
- **Status Workflow**: Pending → In Progress → Completed status tracking
- **Tag System**: Flexible tagging with normalization (trimmed, lowercase)
- **Date Management**: Due date tracking with overdue detection
- **Statistics Dashboard**: Aggregated task metrics and analytics

### User Interface

- **Modern Angular 19**: Built with standalone components and latest Angular features
- **Angular Material Design**: Consistent, accessible UI components
- **Responsive Design**: Mobile-first approach with TailwindCSS
- **Real-time Updates**: Reactive forms with Angular signals
- **Interactive Dialogs**: Task creation, editing, and history viewing
- **Confirmation Dialogs**: Safe deletion with user confirmation
- **Snackbar Notifications**: User feedback for all operations
- **Loading States**: Progress indicators for better UX

### Backend Architecture

- **RESTful API**: Well-structured API with consistent response formats
- **3-Layer Architecture**: Controller → Service → Repository pattern
- **Business Logic Encapsulation**: Service layer with comprehensive validation
- **Middleware Stack**: Security, validation, and error handling
- **Database Optimization**: Efficient queries with MongoDB aggregation
- **Input Validation**: Comprehensive request validation with express-validator
- **Error Handling**: Centralized error management with custom error types

## 🛠 Tech Stack

### Backend

- **Runtime**: Node.js 18+
- **Framework**: Express.js 5.x
- **Database**: MongoDB with Mongoose ODM
- **Validation**: express-validator with custom validation chains
- **Security**: Helmet, CORS, compression, rate limiting
- **Environment**: dotenv for configuration management
- **Development**: Nodemon for hot reloading
- **Module System**: ES6 modules with type:"module"

### Frontend

- **Framework**: Angular 19 with standalone components
- **UI Library**: Angular Material 19.x with CDK
- **Styling**: TailwindCSS 4.x + PostCSS
- **State Management**: Angular Signals and reactive patterns
- **Forms**: Reactive forms with custom validators
- **HTTP Client**: Angular HttpClient with interceptors
- **Build Tool**: Angular CLI with Webpack
- **TypeScript**: Strict mode with comprehensive type definitions

### Development & Deployment

- **Package Manager**: npm with Bun support
- **Code Quality**: ESLint configuration
- **Environment Management**: Multi-environment configuration
- **Deployment**: Render (backend), Vercel-ready (frontend)
- **Database Initialization**: Automated seeding scripts

## 📋 Prerequisites

- **Node.js**: v18.0.0 or higher
- **MongoDB**: v5.0 or higher (local or cloud instance)
- **Package Manager**: npm v8+ or Bun (alternative)
- **Git**: For version control
- **Modern Browser**: Chrome, Firefox, Safari, or Edge

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/JorgeLombana/MEAN
cd MEAN
```

### 2. Backend Setup

#### Install Dependencies

```bash
cd backend
npm install
```

#### Environment Configuration

Create a `.env` file in the backend directory:

```env
# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority

# Server Configuration
PORT=5000
NODE_ENV=development

# API Configuration
API_VERSION=v1

# Security Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4200

```

#### Initialize Database

```bash
# Run database initialization script
npm run init-db
```

#### Start Backend Development Server

```bash
# Development mode with hot reloading
npm run dev

# Or production mode
npm start
```

The backend API will be available at `http://localhost:5000`

### 3. Frontend Setup

#### Install Dependencies

```bash
cd frontend
npm install
```

#### Environment Configuration

The frontend uses environment files in `src/environments/`:

**Development** (`environment.ts`):

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api',
  appName: 'Task Manager',
  version: '1.0.0',
  enableDebugMode: true,
  logLevel: 'debug',
};
```

**QA** (`environment.qa.ts`):

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api',
  appName: 'Task Manager (QA)',
  version: '1.0.0',
  enableDebugMode: true,
  logLevel: 'warn',
};
```

**Production** (`environment.prod.ts`):

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://task-management-ehz6.onrender.com/api/v1',
  appName: 'Task Manager',
  version: '1.0.0',
  enableDebugMode: false,
  logLevel: 'error',
};
```

#### Start Frontend Development Server

```bash
# Development server
npm start
# or
ng serve

# QA environment
npm run start:qa

# Production simulation
npm run start:prod
```

The frontend application will be available at `http://localhost:4200`

## 🌐 Live Deployment

### Production URLs

- **Frontend Application**: [https://mean-m7kz.onrender.com](https://mean-m7kz.onrender.com)
- **Backend API**: [https://task-management-ehz6.onrender.com](https://task-management-ehz6.onrender.com)

Both applications are deployed on Render with automatic deployments from the main branch.

## 🏗 Architecture & Design Patterns

### Backend Architecture

#### Layered Architecture Pattern

The backend follows a layer architecture pattern based on separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │ Routes          │ │ Controllers     │ │ Middlewares     │ │
│ │ - API Endpoints │ │ - HTTP Handlers │ │ - Validation    │ │
│ │ - Route Config  │ │ - Request Parse │ │ - Security      │ │
│ │ - Middleware    │ │ - Response Form │ │ - Error Handle  │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────┐
│                     SERVICE LAYER                           │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │ Business Logic  │ │ Data Transform  │ │ Validation      │ │
│ │ - CRUD Logic    │ │ - Tag Normal    │ │ - Date Valid    │ │
│ │ - Status Rules  │ │ - Field Sanit   │ │ - Business Rule │ │
│ │ - Processing    │ │ - Data Format   │ │ - Error Handle  │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────┐
│                   REPOSITORY LAYER                          │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │ Data Access     │ │ Query Builder   │ │ DB Operations   │ │
│ │ - CRUD Methods  │ │ - Aggregation   │ │ - Transactions  │ │
│ │ - Find/Filter   │ │ - Search Logic  │ │ - Performance   │ │
│ │ - Statistics    │ │ - Pagination    │ │ - Optimization  │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                             │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │ Models/Schemas  │ │ Database        │ │ Middleware      │ │
│ │ - Task Schema   │ │ - MongoDB       │ │ - Pre/Post Save │ │
│ │ - History Track │ │ - Collections   │ │ - Validation    │ │
│ │ - Validation    │ │ - Indexes       │ │ - History Track │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Directory Structure

```
backend/src/
├── app.js                        # Express app configuration
├── api/                          # API versioning and routing
│   ├── index.js                  # Main API router
│   └── v1/                       # Version 1 API
│       ├── index.js              # V1 router with health check
│       ├── controllers/          # HTTP request handlers
│       │   └── task.controller.js
│       ├── routes/               # Route definitions
│       │   └── task.routes.js
│       └── services/             # Business logic layer
│           └── task.service.js
├── config/                       # Configuration files
│   └── db.js                     # Database connection
├── middlewares/                  # Express middlewares
│   ├── errorHandler.js           # Centralized error handling
│   ├── security.js               # Rate limiting & security
│   └── validation.js             # Request validation
├── models/                       # Mongoose models & schemas
│   └── taskModel.js
├── repositories/                 # Data access layer
│   └── taskRepository.js
└── utils/                        # Utility functions
    └── logger.js
```

#### Implementation Details

**1. Routes Layer (`/api/v1/routes/task.routes.js`)**

```javascript
// Route definitions with middleware chains
router.post('/', createTaskLimiter, validateTask, taskController.createTask);
router.get('/', validateTaskQuery, taskController.getAllTasks);
router.get('/stats', taskController.getTaskStats);
router.get('/:id', validateId, taskController.getTaskById);
router.put('/:id', validateId, validateTaskUpdate, validateStatusTransition, taskController.updateTask);
router.delete('/:id', validateId, taskController.deleteTask);
```

**2. Controller Layer (`/api/v1/controllers/task.controller.js`)**

```javascript
class TaskController {
  async createTask(req, res, next) {
    try {
      const task = await taskService.createTask(req.body);
      res.status(201).json({
        success: true,
        message: 'Task created successfully.',
        data: task,
        requestId: req.id,
        version: 'v1'
      });
    } catch (error) {
      next(error); // Centralized error handling
    }
  }
}
```

**3. Service Layer (`/api/v1/services/task.service.js`)**

```javascript
class TaskService {
  async createTask(taskData) {
    // Business logic: default priority, tag normalization
    if (taskData.priority === undefined) {
      taskData.priority = 'Medium';
    }
    
    // Tag normalization and validation
    if (taskData.tags && Array.isArray(taskData.tags)) {
      taskData.tags = taskData.tags
        .map(tag => typeof tag === 'string' ? tag.trim().toLowerCase() : '')
        .filter(tag => tag.length > 0);
      taskData.tags = [...new Set(taskData.tags)]; // Ensure uniqueness
    }
    
    // Date validation
    if (taskData.dueDate && new Date(taskData.dueDate) <= new Date()) {
      throw new Error('Due date must be a future date.');
    }
    
    return await taskRepository.create(taskData);
  }
}
```

**4. Repository Layer (`/repositories/taskRepository.js`)**

```javascript
class TaskRepository {
  async create(taskData) {
    const task = new Task(taskData);
    return await task.save();
  }
  
  async findAll(filter = {}, options = {}) {
    const { sort = { dueDate: 1 }, skip = 0, limit = 10, select = null } = options;
    
    let query = Task.find(filter);
    if (select) query = query.select(select);
    if (sort && Object.keys(sort).length > 0) query = query.sort(sort);
    
    const numSkip = Number(skip);
    const numLimit = Number(limit);
    
    if (!isNaN(numSkip) && numSkip >= 0) query = query.skip(numSkip);
    if (!isNaN(numLimit) && numLimit > 0) query = query.limit(numLimit);
    
    return await query.lean().exec();
  }
}
```

**5. Model Layer (`/models/taskModel.js`)**

```javascript
const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required and cannot be empty.'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters long.'],
    maxlength: [100, 'Title cannot exceed 100 characters.'],
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed'],
    required: [true, 'Status is required.'],
    default: 'Pending',
  },
  // ... other fields
  history: [historySchema], // Embedded audit trail
}, { timestamps: true });

// Virtual for overdue calculation
taskSchema.virtual('isOverdue').get(function () {
  return this.dueDate && this.dueDate < new Date() && this.status !== 'Completed';
});

// Pre-save middleware for automatic history tracking
taskSchema.pre('save', async function (next) {
  // Tag normalization and history tracking logic
});
```

#### Middleware Stack

**Security Middleware (`/middlewares/security.js`)**

```javascript
// General rate limiter: 100 requests per 15 minutes
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests from this IP' }
});

// Task creation limiter: 20 tasks per 15 minutes
export const createTaskLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many tasks created from this IP' }
});
```

**Validation Middleware (`/middlewares/validation.js`)**

```javascript
export const validateTask = [
  body('title')
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 characters')
    .trim(),
  body('dueDate')
    .notEmpty().withMessage('Due date is required')
    .isISO8601().withMessage('Must be valid ISO 8601 date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Due date must be in the future');
      }
      return true;
    }),
  handleValidationErrors
];
```

**Error Handling Middleware (`/middlewares/errorHandler.js`)**

```javascript
const errorHandler = (err, req, res, next) => {
  // Comprehensive error logging with request context
  console.error(`Error: ${err.status || 500} - ${err.message} - ${req.method} ${req.originalUrl}`);
  
  // Handle different error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message,
        value: e.value
      }))
    });
  }
  
  // Generic error response
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
};
```

#### Key Features

- **API Versioning**: Structured `/api/v1/` routing with support for future versions
- **Automatic History Tracking**: Pre-save middleware captures all changes
- **Comprehensive Validation**: Multiple validation layers (express-validator + Mongoose)
- **Rate Limiting**: General and endpoint-specific rate limiting
- **Error Handling**: Centralized error middleware with proper status codes
- **Request Tracking**: Unique request IDs for debugging and monitoring
- **Security Headers**: Helmet.js for security best practices
- **Performance**: Compression, query optimization, and lean queries

#### Database Schema Design

**Task Model with Comprehensive History Tracking**:

```javascript
const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required and cannot be empty.'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters long.'],
      maxlength: [100, 'Title cannot exceed 100 characters.'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters.'],
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'In Progress', 'Completed'],
        message: 'Status must be: Pending, In Progress, or Completed',
      },
      required: [true, 'Status is required.'],
      default: 'Pending',
    },
    priority: {
      type: String,
      enum: {
        values: ['Low', 'Medium', 'High'],
        message: 'Priority must be: Low, Medium, or High',
      },
      default: 'Medium',
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required and cannot be empty.'],
      validate: {
        validator: function (value) {
          if (this.isNew || this.isModified('dueDate')) {
            return value instanceof Date && value.getTime() > Date.now();
          }
          return true;
        },
        message: 'Due date must be a future date',
      },
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function (tagsArray) {
          if (!tagsArray || tagsArray.length === 0) return true;
          const cleanTags = tagsArray
            .map((tag) => (typeof tag === 'string' ? tag.trim().toLowerCase() : ''))
            .filter((tag) => tag.length > 0);
          return cleanTags.length === new Set(cleanTags).size; // Uniqueness check
        },
        message: 'Tags must be unique, non-empty strings',
      },
    },
    history: [historySchema], // Embedded audit trail
  },
  {
    timestamps: true, // Auto createdAt/updatedAt
    toJSON: { virtuals: true },
  }
);

// Virtual for overdue calculation
taskSchema.virtual('isOverdue').get(function () {
  return this.dueDate && this.dueDate < new Date() && this.status !== 'Completed';
});

// Indexes for query optimization
taskSchema.index({ dueDate: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ tags: 1 });
taskSchema.index({ createdAt: -1 });
```

**History Tracking Schema**:

```javascript
const historySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ['created', 'updated', 'status_changed'],
      required: [true, 'History action is required.'],
    },
    field: {
      type: String,
      required: function () {
        return this.action === 'updated' || this.action === 'status_changed';
      },
    },
    oldValue: { type: mongoose.Schema.Types.Mixed },
    newValue: { type: mongoose.Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true }
);
```

**Pre-save Middleware for History Tracking**:

```javascript
taskSchema.pre('save', async function (next) {
  try {
    // Tag normalization
    if (this.isModified('tags') || this.isNew) {
      if (this.tags && Array.isArray(this.tags)) {
        this.tags = this.tags
          .map((tag) => (typeof tag === 'string' ? tag.trim().toLowerCase() : ''))
          .filter((tag) => tag.length > 0);
        this.tags = [...new Set(this.tags)]; // Ensure uniqueness
      }
    }

    // History tracking
    if (this.isNew) {
      this.history.push({
        action: 'created',
        newValue: {
          title: this.title,
          status: this.status,
          priority: this.priority,
          dueDate: this.dueDate,
        },
      });
    } else {
      // Compare with original document for changes
      const original = await mongoose.model('Task').findById(this._id).lean();
      const modifiedPaths = this.modifiedPaths({ includeChildren: true });

      modifiedPaths.forEach((field) => {
        if (!['history', 'updatedAt', 'createdAt', '__v'].includes(field)) {
          const oldValue = original[field];
          const newValue = this[field];

          if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            this.history.push({
              action: field === 'status' ? 'status_changed' : 'updated',
              field: field,
              oldValue: oldValue,
              newValue: newValue,
            });
          }
        }
      });
    }
    next();
  } catch (error) {
    next(new Error(`Error in Task pre-save middleware: ${error.message}`));
  }
});
```

### Frontend Architecture

#### Feature-Based Architecture with Standalone Components

The frontend follows Angular's modern feature-based architecture:

```
src/app/
├── app.component.ts              # Root component
├── app.config.ts                 # Application configuration
├── app.routes.ts                 # Route configuration
├── main.ts                       # Bootstrap configuration
├── features/                     # Feature modules
│   └── task-management/          # Task feature module
│       ├── components/           # Feature-specific components
│       │   ├── task-form-dialog/
│       │   │   ├── task-form-dialog.component.ts
│       │   │   └── task-form-dialog.component.html
│       │   └── task-history-dialog/
│       │       ├── task-history-dialog.component.ts
│       │       └── task-history-dialog.component.html
│       ├── models/               # TypeScript interfaces
│       │   ├── task.interface.ts
│       │   ├── task-service.interface.ts
│       │   └── task-form-dialog.interfaces.ts
│       ├── pages/                # Smart components (containers)
│       │   └── task-list/
│       │       ├── task-list.component.ts
│       │       └── task-list.component.html
│       └── services/             # Feature services
│           └── task.service.ts
├── shared/                       # Shared components
│   ├── components/
│   │   └── confirmation-dialog/
│   └── interfaces/
└── environments/                 # Environment configurations
    ├── environment.ts
    ├── environment.qa.ts
    └── environment.prod.ts
```

#### Angular 19 Modern Patterns

**1. Standalone Components**

```typescript
@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatChipsModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './task-list.component.html',
})
export class TaskListComponent implements OnInit, AfterViewInit {
  // Component implementation
}
```

**2. Signal-Based State Management**

```typescript
export class TaskListComponent {
  // Reactive signals for state management
  public readonly tasks = signal<Task[]>([]);
  public readonly filters = signal<TaskFilters>({});
  public readonly currentPage = signal<number>(1);
  public readonly pageSize = signal<number>(10);
  public readonly totalItems = signal<number>(0);
  public readonly isLoadingTasks = signal<boolean>(false);

  // Computed values derived from signals
  public readonly dataSource = computed(() => {
    return new MatTableDataSource<Task>(this.tasks());
  });

  public readonly hasActiveFilters = computed(() => {
    const currentFilters = this.filters();
    return !!(
      currentFilters.search ||
      currentFilters.status ||
      currentFilters.priority ||
      (currentFilters.tags && currentFilters.tags.length > 0)
    );
  });

  public readonly activeFiltersCount = computed(() => {
    const currentFilters = this.filters();
    return [
      !!currentFilters.search,
      !!currentFilters.status,
      !!currentFilters.priority,
      !!(currentFilters.tags && currentFilters.tags.length > 0),
    ].filter(Boolean).length;
  });
}
```

**3. Reactive Forms with Custom Validators**

```typescript
export class TaskFormDialogComponent {
  public readonly taskForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(500)]],
    status: [TaskStatus.PENDING, [Validators.required]],
    priority: [TaskPriority.MEDIUM, [Validators.required]],
    dueDate: ['', [Validators.required, this.futureDateValidator()]],
    tags: [''],
  });

  private futureDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const selectedDate = new Date(control.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return selectedDate <= today ? { pastDate: { value: control.value } } : null;
    };
  }
}
```

**4. Service Layer with HTTP Client**

```typescript
@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/tasks`;
  private snackBar = inject(MatSnackBar);

  getTasks(filters?: TaskFilters, page: number = 1, limit: number = 10): Observable<PaginatedTasksResponse> {
    const params = this.buildQueryParams(filters, page, limit);
    return this.http.get<BackendResponse<Task[]>>(this.apiUrl, { params }).pipe(map(this.transformTasksResponse));
  }

  createTask(task: CreateTaskDto): Observable<Task> {
    return this.http.post<ApiResponse<Task>>(this.apiUrl, task).pipe(
      map((response) => {
        if (response.message) {
          this.showSuccessMessage(response.message);
        }
        return response.data;
      }),
      catchError(this.handleError.bind(this))
    );
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'An unexpected error occurred';

    if (error.error?.errors) {
      const fieldErrors = error.error.errors.map((err: any) => `${err.field}: ${err.message}`).join(', ');
      errorMessage = `Validation failed: ${fieldErrors}`;
    }

    return throwError(() => new Error(errorMessage));
  }
}
```

**5. Modern Angular Bootstrap Configuration**

```typescript
// main.ts - Standalone bootstrap
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

bootstrapApplication(AppComponent, {
  providers: [provideHttpClient(), provideAnimationsAsync(), provideRouter(routes)],
});
```

#### TypeScript Interface Design

```typescript
// Comprehensive type definitions
export interface Task {
  _id?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date;
  tags: string[];
  createdAt?: Date;
  updatedAt?: Date;
  history?: TaskHistoryEntry[];
  isOverdue?: boolean;
}

export enum TaskStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
}

export enum TaskPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
}

export interface TaskFilters {
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  tags?: string[];
  startDate?: Date;
  endDate?: Date;
  sortBy?: 'dueDate' | 'priority' | 'status';
  sortOrder?: 'asc' | 'desc';
}
```

## 🔌 API Documentation

### Base URL

- **Development**: `http://localhost:5000/api/v1`
- **Production**: `https://task-management-ehz6.onrender.com/api/v1`

### Authentication

Currently, the API doesn't require authentication.

### Rate Limiting

- **General endpoints**: 100 requests per 15 minutes per IP
- **Task creation**: 20 requests per 15 minutes per IP (stricter for write operations)

### API Health Check

**GET /health**

- **Description**: Check API v1 health status and system information
- **Response**: System status, uptime, memory usage, and environment info

**GET /info**

- **Description**: General API information including supported versions
- **Response**: API versioning and endpoint information

---

### 📋 Tasks Resource

#### **GET /tasks**

Retrieve tasks with advanced filtering, sorting, and pagination capabilities.

**Query Parameters:**

- `status` (string, optional): Filter by status
  - Values: `Pending`, `In Progress`, `Completed`
- `priority` (string, optional): Filter by priority level
  - Values: `High`, `Medium`, `Low`
- `search` (string, optional): Text search in title and description (case-insensitive)
- `tags` (string, optional): Comma-separated list of tags for filtering
  - Example: `work,urgent,frontend`
- `startDate` (string, optional): Start date filter (ISO 8601 format)
  - Example: `2024-01-01T00:00:00.000Z`
- `endDate` (string, optional): End date filter (ISO 8601 format)
  - Example: `2024-12-31T23:59:59.999Z`
- `sortBy` (string, optional): Field to sort by
  - Values: `dueDate`, `priority`, `status`, `createdAt`, `updatedAt`
  - Default: `dueDate`
- `sortOrder` (string, optional): Sort direction
  - Values: `asc`, `desc`
  - Default: `asc`
- `page` (number, optional): Page number for pagination
  - Default: `1`, Min: `1`
- `limit` (number, optional): Items per page
  - Default: `10`, Min: `1`, Max: `100`

**Example Request:**

```bash
GET /api/v1/tasks?status=Pending&priority=High&search=urgent&page=1&limit=20
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Tasks retrieved successfully.",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Complete urgent report",
      "description": "Quarterly financial analysis due tomorrow",
      "status": "Pending",
      "priority": "High",
      "dueDate": "2024-06-15T17:00:00.000Z",
      "tags": ["work", "urgent", "finance"],
      "createdAt": "2024-06-01T10:00:00.000Z",
      "updatedAt": "2024-06-01T10:00:00.000Z",
      "isOverdue": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 47,
    "pages": 3,
    "hasNext": true,
    "hasPrev": false
  },
  "requestId": "req_abc123",
  "version": "v1"
}
```

---

#### **GET /tasks/:id**

Retrieve a specific task by its unique ObjectId.

**Parameters:**

- `id` (string, required): MongoDB ObjectId of the task

**Example Request:**

```bash
GET /api/v1/tasks/507f1f77bcf86cd799439011
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Task retrieved successfully.",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Complete urgent report",
    "description": "Quarterly financial analysis due tomorrow",
    "status": "Pending",
    "priority": "High",
    "dueDate": "2024-06-15T17:00:00.000Z",
    "tags": ["work", "urgent", "finance"],
    "history": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "action": "created",
        "newValue": {
          "title": "Complete urgent report",
          "status": "Pending",
          "priority": "High"
        },
        "timestamp": "2024-06-01T10:00:00.000Z"
      }
    ],
    "createdAt": "2024-06-01T10:00:00.000Z",
    "updatedAt": "2024-06-01T10:00:00.000Z",
    "isOverdue": false
  },
  "requestId": "req_def456",
  "version": "v1"
}
```

**Error Response (404):**

```json
{
  "success": false,
  "error": {
    "type": "NotFoundError",
    "message": "Task not found"
  }
}
```

---

#### **POST /tasks**

Create a new task with comprehensive validation and automatic history tracking.

**Request Body:**

```json
{
  "title": "string (required, 3-100 characters)",
  "description": "string (optional, max 500 characters)",
  "priority": "High|Medium|Low (optional, default: Medium)",
  "dueDate": "ISO 8601 date string (required, must be future date)",
  "tags": ["array of strings (optional, each tag max 50 chars)"]
}
```

**Example Request:**

```bash
POST /api/v1/tasks
Content-Type: application/json

{
  "title": "Implement user authentication",
  "description": "Add JWT-based authentication system with refresh tokens",
  "priority": "High",
  "dueDate": "2024-06-20T18:00:00.000Z",
  "tags": ["backend", "security", "authentication"]
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Task created successfully.",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "title": "Implement user authentication",
    "description": "Add JWT-based authentication system with refresh tokens",
    "status": "Pending",
    "priority": "High",
    "dueDate": "2024-06-20T18:00:00.000Z",
    "tags": ["backend", "security", "authentication"],
    "history": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "action": "created",
        "newValue": {
          "title": "Implement user authentication",
          "status": "Pending",
          "priority": "High",
          "dueDate": "2024-06-20T18:00:00.000Z"
        },
        "timestamp": "2024-06-01T14:30:00.000Z"
      }
    ],
    "createdAt": "2024-06-01T14:30:00.000Z",
    "updatedAt": "2024-06-01T14:30:00.000Z",
    "isOverdue": false
  },
  "requestId": "req_ghi789",
  "version": "v1"
}
```

**Validation Error Response (400):**

```json
{
  "success": false,
  "error": {
    "type": "ValidationError",
    "message": "Validation failed",
    "errors": [
      {
        "field": "title",
        "message": "Title must be at least 3 characters long",
        "value": "Hi"
      },
      {
        "field": "dueDate",
        "message": "Due date must be in the future",
        "value": "2024-05-01T10:00:00.000Z"
      }
    ]
  }
}
```

---

#### **PUT /tasks/:id**

Update an existing task with automatic status transition validation and history tracking.

**Parameters:**

- `id` (string, required): MongoDB ObjectId of the task

**Request Body:** (All fields optional, only include fields to update)

```json
{
  "title": "string (3-100 characters)",
  "description": "string (max 500 characters)",
  "status": "Pending|In Progress|Completed",
  "priority": "High|Medium|Low",
  "dueDate": "ISO 8601 date string",
  "tags": ["array of strings"]
}
```

**Status Transition Rules:**

- `Pending` → `In Progress` ✅
- `Pending` → `Completed` ✅
- `In Progress` → `Completed` ✅
- `In Progress` → `Pending` ✅
- `Completed` → `Pending` ❌ (not allowed)
- `Completed` → `In Progress` ❌ (not allowed)

**Example Request:**

```bash
PUT /api/v1/tasks/507f1f77bcf86cd799439013
Content-Type: application/json

{
  "status": "In Progress",
  "description": "Started implementing JWT middleware"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Task updated successfully.",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "title": "Implement user authentication",
    "description": "Started implementing JWT middleware",
    "status": "In Progress",
    "priority": "High",
    "dueDate": "2024-06-20T18:00:00.000Z",
    "tags": ["backend", "security", "authentication"],
    "history": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "action": "created",
        "newValue": {
          /* creation data */
        },
        "timestamp": "2024-06-01T14:30:00.000Z"
      },
      {
        "_id": "507f1f77bcf86cd799439015",
        "action": "status_changed",
        "field": "status",
        "oldValue": "Pending",
        "newValue": "In Progress",
        "timestamp": "2024-06-02T09:15:00.000Z"
      },
      {
        "_id": "507f1f77bcf86cd799439016",
        "action": "updated",
        "field": "description",
        "oldValue": "Add JWT-based authentication system with refresh tokens",
        "newValue": "Started implementing JWT middleware",
        "timestamp": "2024-06-02T09:15:00.000Z"
      }
    ],
    "createdAt": "2024-06-01T14:30:00.000Z",
    "updatedAt": "2024-06-02T09:15:00.000Z",
    "isOverdue": false
  },
  "requestId": "req_jkl012",
  "version": "v1"
}
```

---

#### **DELETE /tasks/:id**

Permanently delete a task from the system.

**Parameters:**

- `id` (string, required): MongoDB ObjectId of the task

**Example Request:**

```bash
DELETE /api/v1/tasks/507f1f77bcf86cd799439013
```

**Success Response (204):**

```
204 No Content
```

**Error Response (404):**

```json
{
  "success": false,
  "error": {
    "type": "NotFoundError",
    "message": "Task not found"
  }
}
```

---

#### **GET /tasks/:id/history**

Retrieve the complete change history for a specific task.

**Parameters:**

- `id` (string, required): MongoDB ObjectId of the task

**Example Request:**

```bash
GET /api/v1/tasks/507f1f77bcf86cd799439013/history
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Task history retrieved successfully.",
  "data": {
    "taskId": "507f1f77bcf86cd799439013",
    "taskTitle": "Implement user authentication",
    "history": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "action": "created",
        "newValue": {
          "title": "Implement user authentication",
          "status": "Pending",
          "priority": "High",
          "dueDate": "2024-06-20T18:00:00.000Z"
        },
        "timestamp": "2024-06-01T14:30:00.000Z"
      },
      {
        "_id": "507f1f77bcf86cd799439015",
        "action": "status_changed",
        "field": "status",
        "oldValue": "Pending",
        "newValue": "In Progress",
        "timestamp": "2024-06-02T09:15:00.000Z"
      },
      {
        "_id": "507f1f77bcf86cd799439016",
        "action": "updated",
        "field": "description",
        "oldValue": "Add JWT-based authentication system",
        "newValue": "Started implementing JWT middleware",
        "timestamp": "2024-06-02T09:15:00.000Z"
      }
    ]
  },
  "requestId": "req_mno345",
  "version": "v1"
}
```

---

#### **GET /tasks/stats**

Retrieve aggregated statistics about all tasks in the system.

**Example Request:**

```bash
GET /api/v1/tasks/stats
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Task statistics retrieved successfully.",
  "data": {
    "total": 47,
    "pending": 15,
    "inProgress": 12,
    "completed": 20,
    "overdue": 8,
    "highPriority": 10,
    "mediumPriority": 25,
    "lowPriority": 12
  },
  "requestId": "req_pqr678",
  "version": "v1"
}
```

---

### 🚨 Error Handling

The API uses consistent error response formats with appropriate HTTP status codes:

#### HTTP Status Codes

- **200 OK**: Successful GET requests
- **201 Created**: Successful resource creation
- **204 No Content**: Successful DELETE requests
- **400 Bad Request**: Validation errors, malformed requests
- **404 Not Found**: Resource not found
- **422 Unprocessable Entity**: Business logic validation errors
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Unexpected server errors

#### Error Response Structure

```json
{
  "success": false,
  "error": {
    "type": "ErrorType",
    "message": "Human-readable error description",
    "details": {
      "field": "Additional context",
      "code": "ERROR_CODE"
    }
  },
  "requestId": "req_xyz789",
  "timestamp": "2024-06-01T10:00:00.000Z"
}
```

#### Common Error Types

**ValidationError (400)**

```json
{
  "success": false,
  "error": {
    "type": "ValidationError",
    "message": "Validation failed",
    "errors": [
      {
        "field": "title",
        "message": "Title is required",
        "value": ""
      },
      {
        "field": "dueDate",
        "message": "Due date must be in the future",
        "value": "2024-05-01T10:00:00.000Z"
      }
    ]
  }
}
```

**NotFoundError (404)**

```json
{
  "success": false,
  "error": {
    "type": "NotFoundError",
    "message": "Task with ID '507f1f77bcf86cd799439011' not found"
  }
}
```

**InvalidStatusTransitionError (422)**

```json
{
  "success": false,
  "error": {
    "type": "InvalidStatusTransitionError",
    "message": "Cannot transition from 'Completed' to 'In Progress'",
    "details": {
      "currentStatus": "Completed",
      "requestedStatus": "In Progress",
      "allowedTransitions": ["Pending"]
    }
  }
}
```

**RateLimitError (429)**

```json
{
  "success": false,
  "error": {
    "type": "RateLimitError",
    "message": "Too many requests. Please try again later.",
    "details": {
      "limit": 20,
      "window": "15 minutes",
      "resetTime": "2024-06-01T10:15:00.000Z"
    }
  }
}
```

---

### 📋 Response Format Summary

**Success Response**:

```json
{
  "success": true,
  "data": {
    /* response data */
  },
  "message": "Operation completed successfully",
  "requestId": "req_123",
  "version": "v1"
}
```

**Error Response**:

```json
{
  "success": false,
  "error": {
    "type": "ValidationError|NotFoundError|InternalServerError",
    "message": "Human-readable error message",
    "details": {
      /* additional error details */
    }
  },
  "requestId": "req_123",
  "timestamp": "2024-06-01T10:00:00.000Z"
}
```

**Paginated Response**:

```json
{
  "success": true,
  "data": [
    /* array of tasks */
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 47,
    "pages": 5,
    "hasNext": true,
    "hasPrev": false
  },
  "message": "Tasks retrieved successfully",
  "requestId": "req_123",
  "version": "v1"
}
```

## 🎯 Development Scripts

### Backend Scripts

```bash
# Development
npm run dev          # Start with nodemon (hot reload)
npm start           # Production start
npm run init-db     # Initialize/seed database

# Database
npm run db:reset    # Reset database (if implemented)
npm run db:seed     # Seed sample data (if implemented)
```

### Frontend Scripts

```bash
# Development
npm start           # Start dev server (http://localhost:4200)
npm run start:qa    # Start with QA environment
npm run start:prod  # Start with production environment

# Building
npm run build       # Production build
npm run build:qa    # QA build
npm run build:prod  # Production build (explicit)

# Development tools
npm run watch       # Build in watch mode
npm test           # Run unit tests
npm run lint       # Run ESLint (if configured)
```

## 🌍 Environment Configuration

### Backend Environment Variables

Required environment variables for backend:

```env
# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority

# Server Configuration
PORT=5000
NODE_ENV=development

# API Configuration
API_VERSION=v1

# Security Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4200

```

### Frontend Environment Files

The frontend uses Angular's environment system with three configurations:

1. **Development** (`environment.ts`)
2. **QA** (`environment.qa.ts`)
3. **Production** (`environment.prod.ts`)

Each environment file contains:

- `apiUrl`: Backend API endpoint
- `appName`: Application name for display
- `version`: Application version
- `enableDebugMode`: Debug logging toggle
- `logLevel`: Logging verbosity

## 📚 Code Quality & Standards

### Code Organization Principles

- **Single Responsibility**: Each class/function has one purpose
- **Dependency Injection**: Services injected via Angular DI or constructor
- **Interface Segregation**: Small, focused interfaces
- **Don't Repeat Yourself**: Shared utilities and components

### TypeScript Configuration

- **Strict Mode**: Enabled for type safety
- **Path Mapping**: Organized imports with custom paths
- **Decorators**: Angular decorators for metadata

### Error Handling Strategy

- **Backend**: Centralized error middleware with custom error types
- **Frontend**: HTTP interceptors for global error handling
- **User Feedback**: Snackbar notifications for user actions

### Development Tips

1. **Hot Reloading**: Both backend (nodemon) and frontend (ng serve) support hot reloading
2. **Debug Mode**: Enable debug logging in development environments
3. **Database Seeding**: Use init-db script for consistent test data
4. **API Testing**: Use tools like Postman or curl for API testing

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
