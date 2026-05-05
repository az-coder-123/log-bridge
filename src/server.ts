import chalk from "chalk";
import { createApp } from "./app.js";
import { APP_CONFIG, getLocalIP } from "./config/index.js";
import { startDiscovery } from "./services/discoveryService.js";

/**
 * Bootstrap the server.
 */
function main(): void {
  const app = createApp();
  const port = APP_CONFIG.port;
  const localIP = getLocalIP();

  const server = app.listen(port, APP_CONFIG.host, () => {
    console.log(chalk.green.bold("\n🚀 Log Bridge Server is running!\n"));
    console.log(`  ${chalk.cyan("Local:")}   http://localhost:${port}`);
    console.log(`  ${chalk.cyan("Network:")} http://${localIP}:${port}`);
    console.log(
      `  ${chalk.cyan("Logs:")}   ${chalk.dim(APP_CONFIG.logs.file)}\n`
    );

    // Start mDNS service discovery
    const stopDiscovery = startDiscovery(port);

    // Graceful shutdown
    const shutdown = () => {
      console.log(chalk.yellow("\n🛑 Shutting down server..."));
      stopDiscovery();
      server.close(() => {
        console.log(chalk.green("✅ Server stopped."));
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  });
}

main();