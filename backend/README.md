# Pidwin Backend

This is the backend service for the Pidwin Fullstack Assessment.

## Overview

The backend is built with:
- Node.js and Express
- TypeScript
- MongoDB for database
- Socket.io for real-time communication

## Setup

### Prerequisites

- Node.js (v18 or later recommended)
- MongoDB (if running locally)
- npm or yarn

### Installation

Install dependencies:

```bash
npm install
```

### Environment Variables

Create a `.env` file in the root of the backend directory with the following variables:

```
PORT=5000
MONGODB_URL=mongodb://localhost:27017/pidwin
```

If you're using Docker Compose, these environment variables will be set automatically.

## Available Commands

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

## Database Seeding

To populate the database with initial user data:

```bash
npm run seed:users
```

This will create the following test users:
- Alice (email: alice@example.com, password: password123)
- Bob (email: bob@example.com, password: securepass)
- Charlie (email: charlie@example.com, password: charliepass)

Each user will have 100 tokens to start with.

## API Endpoints

### User Authentication

- `POST /api/user/login`: User login
- `POST /api/user/signup`: User registration
- `POST /api/user/changePassword`: Change user password (requires authentication)

### Game

- `POST /api/game/placeWager`: Place a wager
- `GET /api/game/status`: Get current game status

## WebSocket Events

The backend uses Socket.io for real-time communication:

- `authenticate`: Client sends user ID to authenticate
- `token_update`: Server sends updated token count to client
- `roll_result`: Server sends dice roll results to client
- `recent_rolls`: Server sends recent roll history to client
- `win_streaks`: Server broadcasts top win streaks to all clients

## Docker

The backend can be run in a Docker container using the provided Dockerfile and docker-compose.yml.

To build and run with Docker Compose:

```bash
docker compose up
```

This will start both the MongoDB database and the backend service.
