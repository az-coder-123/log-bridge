import chalk from "chalk";
import { LogLevel, type LogEntry } from "../types/log.js";

/**
 * Color mapping for each log level.
 */
const LEVEL_COLORS: Record<LogLevel, (text: string) => string> = {
  [LogLevel.VERBOSE]: chalk.gray,
  [LogLevel.DEBUG]: chalk.cyan,
  [LogLevel.INFO]: chalk.green,
  [LogLevel.WARNING]: chalk.yellow,
  [LogLevel.ERROR]: chalk.red,
  [LogLevel.FATAL]: chalk.bgRed.white.bold,
};

/**
 * Pretty-print a log entry to the terminal with colors.
 */
export function prettyPrint(entry: LogEntry): void {
  const colorize = LEVEL_COLORS[entry.level] ?? chalk.white;
  const time = new Date(entry.timestamp).toLocaleTimeString("vi-VN", {
    hour12: false,
  });

  const levelTag = colorize(`[${entry.level.toUpperCase().padEnd(7)}]`);
  const contextTag = chalk.magenta(`[${entry.context}]`);
  const deviceTag = chalk.blue(`(${entry.device_info.deviceName})`);

  console.log(`${chalk.dim(time)} ${levelTag} ${contextTag} ${deviceTag}`);

  if (entry.payload !== undefined && entry.payload !== null) {
    const payloadStr =
      typeof entry.payload === "object"
        ? JSON.stringify(entry.payload, null, 2)
        : String(entry.payload);

    // Indent each line of the payload for readability
    const indented = payloadStr
      .split("\n")
      .map((line) => chalk.dim("    ") + colorize(line))
      .join("\n");
    console.log(indented);
  }
}