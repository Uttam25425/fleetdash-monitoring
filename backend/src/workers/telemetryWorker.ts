import { parentPort } from "node:worker_threads";
import { generateTelemetryBatch } from "../services/telemetrySimulator.ts";

const workerPort = parentPort;

if (!workerPort) {
  throw new Error("Telemetry worker must run inside a worker thread");
}

setInterval(() => {
  const telemetryBatch = generateTelemetryBatch();
  workerPort.postMessage(telemetryBatch);
}, 1000);