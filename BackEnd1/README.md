# Flowtime Backend

A task management API with intelligent scheduling for optimized productivity.

## Features

- **User Authentication** - JWT-based auth with registration, login, and session management
- **Task Management** - CRUD operations for tasks with priority levels, due dates, and estimated durations
- **Smart Scheduling** - Automatic task scheduling based on user preferences and time blocks
- **Weekly Planning** - View and manage schedules across a full week
- **Productivity Analytics** - Track task completion rates and schedule efficiency

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Authentication:** JWT + bcrypt

## Project Structure

```
BackEnd1/
├── controllers/       # Route handlers
│   ├── auth.controller.js
│   ├── task.controller.js
│   └── schedule.controller.js
├── middleware/         # Express middleware
│   ├── auth.middleware.js
│   ├── error.middleware.js
│   └── validation.middleware.js
├── models/            # Mongoose schemas
│   ├── User.model.js
│   ├── Task.model.js
│   └── Schedule.model.js
├── routes/            # API route definitions
│   ├── auth.routes.js
│   ├── task.routes.js
│   └── schedule.routes.js
├── utils/             # Utilities
│   ├── AppError.js
│   ├── asyncHandler.js
│   └── scheduler.js
├── server.js          # Entry point
└── package.json
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user (protected) |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Get all tasks (filter by status, priority, dueDate) |
| GET | `/api/tasks/:id` | Get single task |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| GET | `/api/tasks/stats/overview` | Get task statistics |

### Schedule
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/schedule/generate` | Generate daily schedule |
| GET | `/api/schedule/:date` | Get schedule for specific date |
| GET | `/api/schedule/week/:date` | Get week schedule |
| PUT | `/api/schedule/:scheduleId/complete/:taskId` | Mark task complete |

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health status |

## Setup

### Prerequisites
- Node.js 16+
- MongoDB Atlas account (or local MongoDB)

### Environment Variables

Create a `.env` file:

```env
PORT=3000
MONGODB_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/flowtime
JWT_SECRET=your-secret-key
JWT_EXPIRE=30d
```

### Installation

```bash
cd BackEnd1
npm install
```

### Running

```bash
# Development (with nodemon)
npm run dev

# Production
npm start
```

## Data Models

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  preferences: {
    workStartHour: Number (0-23, default: 9),
    workEndHour: Number (0-23, default: 17),
    breakDuration: Number (minutes, default: 15),
    lunchBreak: { start: Number, duration: Number },
    maxTasksPerDay: Number (default: 10)
  }
}
```

### Task
```javascript
{
  user: ObjectId,
  title: String,
  description: String,
  priority: 'low' | 'medium' | 'high' | 'urgent',
  status: 'pending' | 'scheduled' | 'completed',
  dueDate: Date,
  estimatedDuration: Number (minutes),
  preferredTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'any',
  scheduledStart: Date,
  scheduledEnd: Date,
  completedAt: Date
}
```

## Scheduler Algorithm

The smart scheduler:
1. Generates time blocks based on user's work hours and break preferences
2. Prioritizes tasks by: urgency > due date > task duration
3. Fits tasks into available slots respecting preferred time of day
4. Calculates a productivity score (scheduled minutes / available minutes)

## License

MIT
