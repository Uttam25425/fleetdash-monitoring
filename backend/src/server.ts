import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { Worker } from "node:worker_threads";
import type { VehicleTelemetry } from "./types/telemetry.ts";
import { connectDatabase } from "./config/database.ts";
import { saveTelemetryBatch } from "./services/telemetryStorage.ts";
import { isValidTelemetryBatch } from "./services/telemetryValidation.ts";
import telemetryRouter from "./routes/telemetryRoutes.ts";
import {
  connectRedis,
  redisPublisher,
  redisSubscriber,
} from "./config/redis.ts";

dotenv.config();

const app = express();
const httpServer = createServer(app);

const PORT = Number(process.env.PORT) || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

app.use(
  cors({
    origin: CLIENT_URL,
  }),
);

app.use(express.json());
app.use("/api/telemetry", telemetryRouter);

app.get("/health", (_request, response) => {
  response.status(200).json({
    status: "ok",
    service: "FleetDash API",
    timestamp: new Date().toISOString(),
  });
});
app.get("/health/services", (_request, response) => {
  const mongodbConnected =
    mongoose.connection.readyState === 1;

  const redisConnected =
    redisPublisher.isReady && redisSubscriber.isReady;

  const allServicesConnected =
    mongodbConnected && redisConnected;

  response
    .status(allServicesConnected ? 200 : 503)
    .json({
      status: allServicesConnected ? "ok" : "degraded",
      service: "FleetDash API",
      dependencies: {
        mongodb: mongodbConnected
          ? "connected"
          : "disconnected",
        redis: redisConnected
          ? "connected"
          : "disconnected",
      },
      timestamp: new Date().toISOString(),
    });
});

const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.emit("server:ready", {
    message: "Connected to FleetDash server",
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const isTypeScriptRuntime = import.meta.url.endsWith(".ts");
const workerExtension = isTypeScriptRuntime ? "ts" : "js";

const telemetryWorker = new Worker(
  new URL(
    `./workers/telemetryWorker.${workerExtension}`,
    import.meta.url
  ),
  {
    execArgv: isTypeScriptRuntime ? ["--import", "tsx"] : [],
  }
);

telemetryWorker.on(
  "message",
  (telemetryBatch: VehicleTelemetry[]) => {
    if (!redisPublisher.isReady) {
      return;
    }
    void redisPublisher
      .publish("fleet:telemetry", JSON.stringify(telemetryBatch))
      .catch((error: unknown) => {
        const message =
          error instanceof Error
            ? error.message
            : "Unknown publisher error";

        console.error("Redis publisher failed:", message);
      });
  }
);

telemetryWorker.on("error", (error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Unknown worker error";

  console.error("Telemetry worker failed:", message);
});

telemetryWorker.on("exit", (code) => {
  if (code !== 0) {
    console.error(`Telemetry worker stopped with code ${code}`);
  }
});
Promise.all([connectDatabase(), connectRedis()])
  .then(() => {
    void redisSubscriber.subscribe("fleet:telemetry", async (message) => {
      try {
        const telemetryBatch = JSON.parse(message);

        if (!isValidTelemetryBatch(telemetryBatch)) {
          console.warn("Invalid telemetry batch rejected");
          return;
        }
        const binaryPayload = Buffer.from(message, "utf8");

        io.emit("telemetry:batch", binaryPayload);
        await saveTelemetryBatch(telemetryBatch);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unknown subscriber error";

        console.error("Redis subscriber failed:", message);
      }
    });
    httpServer.listen(PORT, () => {
      console.log(`FleetDash API running at http://localhost:${PORT}`);
    });
  })
  .catch((error: unknown) => {
    const message =
      error instanceof Error ? error.message : "Unknown database error";

    console.error("Service startup failed:", message);
    process.exit(1);
  });