# Flowtime Backend

A task management API with intelligent scheduling for optimized productivity.

## Features

- **User Authentication** - JWT-based auth with registration, login, and session management
- **Task Management** - CRUD operations for tasks with priority levels, due dates, and estimated durations
- **Smart Scheduling** - Automatic task scheduling based on user preferences, priority, and preferred time of day (morning/afternoon/evening)
- **Weekly Planning** - View and manage schedules across a full week
- **Productivity Analytics** - Track task completion rates and schedule efficiency

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB (Mongoose ODM)
- **Authentication:** JWT + bcrypt

## Project Structure

```
BackEnd1/
├── controllers/        # Thin request/response handlers
│   ├── auth.controller.ts
│   ├── task.controller.ts
│   └── schedule.controller.ts
├── services/           # Business logic layer
│   ├── auth.service.ts
│   ├── task.service.ts
│   └── schedule.service.ts
├── middleware/          # Express middleware
│   ├── auth.middleware.ts
│   ├── error.middleware.ts
│   └── validation.middleware.ts
├── models/             # Mongoose schemas
│   ├── User.model.ts
│   ├── Task.model.ts
│   └── Schedule.model.ts
├── routes/             # API route definitions
│   ├── auth.routes.ts
│   ├── task.routes.ts
│   └── schedule.routes.ts
├── utils/              # Utilities
│   ├── AppError.ts
│   ├── asyncHandler.ts
│   └── scheduler.ts
├── types/              # TypeScript type declarations
│   └── express.d.ts
├── server.ts           # Entry point
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
| DELETE | `/api/tasks/:id` | Delete task (also removes from schedule) |
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

Create a `.env` file in `BackEnd1/`:

```env
PORT=3000
MONGODB_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/flowtime
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
```

### Installation

```bash
cd BackEnd1
npm install
```

### Running

```bash
# Development (with ts-node)
npm run dev

# Production (build then start)
npm run build
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
  status: 'pending' | 'scheduled' | 'completed' | 'missed',
  dueDate: Date,
  estimatedDuration: Number (minutes),
  preferredTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'any',
  isFlexible: Boolean,
  tags: [String],
  scheduledStart: Date,
  scheduledEnd: Date,
  completedAt: Date
}
```

## Scheduler Algorithm

The smart scheduler:
1. Generates time blocks from 6:00 to 22:00 based on user's work hours and break preferences
2. Prioritizes tasks by: urgency > due date > task duration
3. Fits tasks into available slots respecting preferred time of day (morning/afternoon/evening)
4. Calculates a productivity score (scheduled minutes / available minutes)

## License

MIT
