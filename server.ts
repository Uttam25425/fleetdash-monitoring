import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { createServer } from "node:http";
import { Server } from "socket.io";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { VehicleTelemetry } from "./backend/src/types/telemetry.ts";
import { connectDatabase } from "./backend/src/config/database.ts";
import { saveTelemetryBatch } from "./backend/src/services/telemetryStorage.ts";
import { isValidTelemetryBatch } from "./backend/src/services/telemetryValidation.ts";
import { generateTelemetryBatch } from "./backend/src/services/telemetrySimulator.ts";
import telemetryRouter from "./backend/src/routes/telemetryRoutes.ts";
import {
  connectRedis,
  redisPublisher,
  redisSubscriber,
} from "./backend/src/config/redis.ts";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0";
const isProduction = process.env.NODE_ENV === "production";

const app = express();
const httpServer = createServer(app);

app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());

// API Routes
app.use("/api/telemetry", telemetryRouter);

// Database offline / mongoose error fallback middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (
    err?.name === "MongooseError" ||
    err?.name === "MongoNetworkError" ||
    (typeof err?.message === "string" && err.message.includes("buffering timed out"))
  ) {
    console.warn("[AI Studio] Database offline — returning mock fallback response");
    if (req.method === "GET") {
      return res.json(req.path.endsWith("s") || req.path.endsWith("s/") ? [] : {});
    }
    return res.status(503).json({ error: "Service temporarily unavailable (database offline)" });
  }
  next(err);
});

app.get("/health", (_request, response) => {
  response.status(200).json({
    status: "ok",
    service: "FleetDash API",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health/services", (_request, response) => {
  const mongodbConnected = mongoose.connection.readyState === 1;
  const redisConnected = redisPublisher.isReady && redisSubscriber.isReady;

  response.status(200).json({
    status: "ok",
    service: "FleetDash API",
    dependencies: {
      mongodb: mongodbConnected ? "connected" : "in-memory-fallback",
      redis: redisConnected ? "connected" : "in-memory-fallback",
    },
    timestamp: new Date().toISOString(),
  });
});

// Socket.IO Server
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`[FleetDash] Client connected: ${socket.id}`);

  socket.emit("server:ready", {
    message: "Connected to FleetDash server",
  });

  socket.on("disconnect", () => {
    console.log(`[FleetDash] Client disconnected: ${socket.id}`);
  });
});

// Broadcast helper for telemetry
function publishTelemetryBatch(telemetryBatch: VehicleTelemetry[]) {
  if (!redisPublisher.isReady) {
    return;
  }
  void redisPublisher
    .publish("fleet:telemetry", JSON.stringify(telemetryBatch))
    .catch((error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Unknown publisher error";
      console.error("[FleetDash] Redis publisher failed:", message);
    });
}

// Start telemetry simulation (inline interval, resilient in all environments)
function startTelemetrySimulation() {
  setInterval(() => {
    try {
      const telemetryBatch = generateTelemetryBatch();
      publishTelemetryBatch(telemetryBatch);
    } catch (err) {
      console.error("[FleetDash] Simulation cycle error:", err);
    }
  }, 1000);
}

async function startServer() {
  try {
    await Promise.all([connectDatabase(), connectRedis()]);

    void redisSubscriber.subscribe("fleet:telemetry", async (message: string) => {
      try {
        const telemetryBatch = JSON.parse(message);

        if (!isValidTelemetryBatch(telemetryBatch)) {
          console.warn("[FleetDash] Invalid telemetry batch rejected");
          return;
        }

        const binaryPayload = Buffer.from(message, "utf8");
        io.emit("telemetry:batch", binaryPayload);
        await saveTelemetryBatch(telemetryBatch);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unknown subscriber error";
        console.error("[FleetDash] Subscriber processing failed:", message);
      }
    });

    startTelemetrySimulation();

    // Frontend integration: Vite middleware in dev, static files in production
    if (!isProduction) {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true, allowedHosts: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.resolve(__dirname, "dist");
      app.use(express.static(distPath));
      app.get("*", (_request, response) => {
        response.sendFile(path.resolve(distPath, "index.html"));
      });
    }

    httpServer.listen(PORT, HOST, () => {
      console.log(`[FleetDash] Fullstack server running at http://${HOST}:${PORT}`);
    });
  } catch (error: unknown) {
    console.error("[FleetDash] Startup error:", error);
    process.exit(1);
  }
}

void startServer();
