# FleetDash – High-Throughput Fleet Telemetry Dashboard

FleetDash is a real-time, event-driven fleet monitoring system built with React, TypeScript, Node.js, MongoDB Atlas, Redis Cloud, Socket.IO, and Worker Threads.

It generates live telemetry for multiple vehicles, processes data through Redis Pub/Sub, stores historical telemetry using the MongoDB Bucket Pattern, and displays vehicle movement, performance, and geofence alerts on an interactive dashboard.

## Features

- Live telemetry monitoring for 10 simulated vehicles
- React and TypeScript operations dashboard
- Canvas-based real-time fleet visualization
- Vehicle search and status filtering
- Live speed, heading, coordinates, and status updates
- Vehicle selection and detailed inspection
- Rectangular coordinate-based geofencing
- Geofence breach detection and dashboard alerts
- Node.js Worker Threads for telemetry generation
- Redis Cloud Pub/Sub for event distribution
- Socket.IO binary payload streaming
- MongoDB Atlas telemetry storage
- MongoDB Bucket Pattern for time-series data
- Indexed latest-telemetry and performance APIs
- Telemetry validation and error handling
- k6 load testing
- Automated GitHub Actions CI pipeline

## System Architecture

```text
Telemetry Worker
      |
      v
Redis Publisher
      |
      v
Redis Cloud Pub/Sub
      |
      v
Redis Subscriber
      |
      +----> Socket.IO ----> React Dashboard
      |
      +----> MongoDB Atlas Bucket Storage
```

## Technology Stack

### Frontend

- React
- TypeScript
- Vite
- Socket.IO Client
- HTML Canvas
- CSS

### Backend

- Node.js
- Express
- TypeScript
- Socket.IO
- Worker Threads
- Redis
- Mongoose

### Cloud and Testing

- MongoDB Atlas
- Redis Cloud
- k6
- GitHub Actions

## Project Structure

```text
fleetdash-telemetry-dashboard/
├── .github/
│   └── workflows/
│       └── ci.yml
├── backend/
│   ├── load-tests/
│   ├── src/
│   │   ├── config/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   ├── workers/
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── App.css
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   └── package.json
└── README.md
```

## Environment Variables

Create `backend/.env` and add:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=your_mongodb_atlas_connection_string
REDIS_URL=your_redis_cloud_connection_string
```

Never commit the `.env` file or expose database credentials.

## Installation

Clone the repository:

```bash
git clone https://github.com/Uttam25425/fleetdash-telemetry-dashboard.git
cd fleetdash-telemetry-dashboard
```

Install backend dependencies:

```bash
npm install --prefix backend
```

Install frontend dependencies:

```bash
npm install --prefix frontend
```

## Running the Application

Start the backend:

```bash
npm run dev --prefix backend
```

Start the frontend in another terminal:

```bash
npm run dev --prefix frontend
```

Open the dashboard:

```text
http://localhost:5173
```

## API Endpoints

### Health Check

```http
GET /health
```

### Dependency Health Check

```http
GET /health/services
```

### Latest Vehicle Telemetry

```http
GET /api/telemetry/latest/:vehicleId
```

Example:

```text
http://localhost:5000/api/telemetry/latest/VH-001
```

### Query Performance

```http
GET /api/telemetry/performance/:vehicleId
```

Example:

```text
http://localhost:5000/api/telemetry/performance/VH-001
```

## Testing

Run backend unit tests:

```bash
npm test --prefix backend
```

Build the backend:

```bash
npm run build --prefix backend
```

Build the frontend:

```bash
npm run build --prefix frontend
```

Run the k6 load test while the backend is running:

```bash
k6 run backend/load-tests/api-load-test.js
```

## Continuous Integration

The GitHub Actions workflow automatically:

- Installs backend and frontend dependencies
- Runs backend tests
- Builds the TypeScript backend
- Builds the React frontend

The workflow runs on pushes and pull requests to the `main` branch.

## Geofence Monitoring

FleetDash uses configured latitude and longitude boundaries to determine whether a vehicle is inside or outside the operational zone.

Vehicles outside the allowed boundary are marked with a geofence breach alert in the Vehicle Inspector.

## Current Status

Completed functionality includes:

- Real-time telemetry generation
- Worker Thread processing
- Redis Cloud Pub/Sub integration
- Socket.IO binary streaming
- MongoDB Atlas bucket storage
- Indexed telemetry APIs
- Load and performance testing
- Interactive fleet dashboard
- Vehicle search and filtering
- Coordinate-based geofencing
- Automated CI pipeline

## Author

Developed by **Uttam Sahu** as part of the Infotact Solutions Web Development Internship Project.
