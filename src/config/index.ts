import os from "node:os";

/**
 * Application configuration constants.
 */
export const APP_CONFIG = {
  port: parseInt(process.env.PORT ?? "3000", 10),
  host: process.env.HOST ?? "0.0.0.0",

  /** mDNS service settings */
  mdns: {
    name: "FlutterLogServer",
    type: "http",
    protocol: "tcp" as const,
  },

  /** Log file settings */
  logs: {
    dir: "logs",
    file: "logs/app.log",
  },

  /** CORS settings — allow all LAN origins */
  cors: {
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"] as string[],
    allowedHeaders: ["Content-Type", "Authorization"] as string[],
  },
};

/**
 * Get the local network IP address of this machine.
 * Useful for displaying to the developer so Flutter apps can connect.
 */
export function getLocalIP(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const nets = interfaces[name];
    if (!nets) continue;
    for (const net of nets) {
      // Skip internal and non-IPv4 addresses
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "127.0.0.1";
}