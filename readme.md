# Pidwin Assessment

The Pidwin Fullstack Assessment.

## Project Overview

This project consists of a full-stack application with:
- A Node.js/Express backend with MongoDB database
- A React frontend
- WebSocket integration for real-time updates

## Project Setup

There are two ways to run this project:
1. Using Docker Compose (recommended)
2. Running the frontend and backend separately

### Option 1: Using Docker Compose

This method will start the MongoDB database and backend server in Docker containers.

1. Make sure you have Docker and Docker Compose installed on your system.

2. From the project root directory, run:

```bash
docker compose up
```

This will:
- Start a MongoDB container on port 27017
- Build and start the backend container on port 5500
- Set up the necessary network and volumes

3. In a separate terminal, start the frontend:

```bash
cd frontend
npm install
npm start
```

The frontend will be available at http://localhost:3000

### Option 2: Running Frontend and Backend Separately

#### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a **.env file** in the backend directory with the following content:

```
PORT=5000
MONGODB_URL=mongodb://localhost:27017/pidwin
```

4. Start the backend in development mode:

```bash
npm run dev
```

The backend will be available at http://localhost:5000

#### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the frontend development server:

```bash
npm start
```

The frontend will be available at http://localhost:3000

## Available Commands

### Backend Commands

```bash
# Start the production server (requires build first)
npm start

# Start the development server with auto-reload
npm run dev

# Build the TypeScript code
npm run build

# Seed the database with initial users
npm run seed:users
```

### Frontend Commands

```bash
# Start the development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## Database Seeding

To populate the database with initial user data:

```bash
cd backend
npm run seed:users
```

This will create the following test users:
- Alice (email: alice@example.com, password: password123)
- Bob (email: bob@example.com, password: securepass)
- Charlie (email: charlie@example.com, password: charliepass)

Each user will have 100 tokens to start with.

## Accessing the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000 (or http://localhost:5500 if using Docker)
- MongoDB: mongodb://localhost:27017/pidwin
