import { Bonjour } from "bonjour-service";
import { APP_CONFIG, getLocalIP } from "../config/index.js";

/**
 * Starts the mDNS/Bonjour service discovery advertisement.
 * This allows Flutter apps on the LAN to auto-discover this server.
 *
 * @returns A function to stop the advertisement.
 */
export function startDiscovery(port: number): () => void {
  const bonjour = new Bonjour();

  const service = bonjour.publish({
    name: APP_CONFIG.mdns.name,
    type: APP_CONFIG.mdns.type,
    protocol: APP_CONFIG.mdns.protocol,
    port,
    txt: {
      ip: getLocalIP(),
      version: "1.0.0",
    },
  });

  service.on("up", () => {
    console.log(
      `[mDNS] Service "${APP_CONFIG.mdns.name}" advertised on port ${port}`
    );
  });

  service.on("error", (err: Error) => {
    console.error(`[mDNS] Discovery error: ${err.message}`);
  });

  // Return cleanup function
  return () => {
    service.stop?.();
    bonjour.destroy();
    console.log("[mDNS] Service advertisement stopped.");
  };
}