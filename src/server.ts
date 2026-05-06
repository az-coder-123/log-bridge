import chalk from "chalk";
import path from "node:path";
import { createApp } from "./app.js";
import { APP_CONFIG, getLocalIP } from "./config/index.js";
import { startDiscovery } from "./services/discoveryService.js";
import { closeLogFile, initLogFile } from "./services/fileLogService.js";
import { loadFromFile } from "./services/logStore.js";

/**
 * Bootstrap the server.
 */
function main(): void {
  // 1. Initialize log file (create directory + write stream)
  initLogFile();

  // 2. Load existing logs from file into memory
  const logPath = path.resolve(APP_CONFIG.logs.file);
  loadFromFile(logPath);
  console.log(chalk.blue(`📂 Loaded historical logs from: ${logPath}`));

  const app = createApp();
  const port = APP_CONFIG.port;
  const localIP = getLocalIP();

  // 2. Start HTTP server
  const server = app.listen(port, APP_CONFIG.host, () => {
    console.log(chalk.green.bold("\n🚀 Log Bridge Server is running!\n"));
    console.log(`  ${chalk.cyan("Local:")}   http://localhost:${port}`);
    console.log(`  ${chalk.cyan("Network:")} http://${localIP}:${port}`);
    console.log(
      `  ${chalk.cyan("Logs:")}   ${chalk.dim(APP_CONFIG.logs.file)}\n`
    );
  });

  // 3. Start mDNS service discovery
  const stopDiscovery = startDiscovery(port);

  // 4. Graceful shutdown handler
  let isShuttingDown = false;

  const shutdown = async () => {
    if (isShuttingDown) return; // Prevent double shutdown
    isShuttingDown = true;

    console.log(chalk.yellow("\n🛑 Shutting down server..."));

    stopDiscovery();

    await closeLogFile();

    server.close(() => {
      console.log(chalk.green("✅ Server stopped gracefully."));
      process.exit(0);
    });

    // Force exit if graceful shutdown takes too long
    setTimeout(() => {
      console.error(chalk.red("⏱️  Forced shutdown after timeout."));
      process.exit(1);
    }, 5000);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  // 5. Global error handlers — catch anything that slips through
  process.on("uncaughtException", (err: Error) => {
    console.error(chalk.red.bold(`\n💥 Uncaught Exception: ${err.message}`));
    if (err.stack) {
      console.error(chalk.gray(err.stack));
    }
    shutdown();
  });

  process.on("unhandledRejection", (reason: unknown) => {
    const message = reason instanceof Error ? reason.message : String(reason);
    console.error(
      chalk.red.bold(`\n💥 Unhandled Promise Rejection: ${message}`)
    );
    shutdown();
  });
}

main();