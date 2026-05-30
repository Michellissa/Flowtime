# Flowtime Frontend

React-based UI for the Flowtime task management app with intelligent scheduling.

## Features

- **Task Management** - Create, edit, complete, and delete tasks with priority, duration, and preferred time
- **Smart Schedule** - View daily or weekly schedule generated from your tasks
- **Dark/Light Mode** - Theme toggle with localStorage persistence
- **Responsive** - Mobile-friendly layout with always-visible action buttons

## Tech Stack

- **Framework:** React 19
- **Language:** TypeScript
- **Routing:** React Router v7
- **HTTP:** Axios
- **Styling:** CSS with theme-aware custom properties

## Available Scripts

```bash
# Start development server (port 3001)
npm start

# Run tests
npm test

# Build for production
npm run build
```

The development server proxies `/api` requests to `http://localhost:3000` (the backend).

## Project Structure

```
frontend/src/
├── components/         # Reusable UI components
│   ├── Modal.tsx
│   ├── TaskCard.tsx
│   └── TaskForm.tsx
├── context/            # React context providers
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   └── ToastContext.tsx
├── pages/              # Route pages
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── TasksPage.tsx
│   └── SchedulePage.tsx
├── services/           # API service layer
│   └── api.ts
├── styles/             # Global CSS
│   ├── components.css
│   ├── modal.css
│   ├── tasks.css
│   └── theme.css
├── types/              # TypeScript type declarations
│   └── css.d.ts
├── App.tsx             # Main app with routing and layout
└── index.tsx           # Entry point
```
