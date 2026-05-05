/**
 * Log levels supported by the server.
 */
export enum LogLevel {
  VERBOSE = "verbose",
  DEBUG = "debug",
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  FATAL = "fatal",
}

/**
 * Device information sent from the Flutter client.
 */
export interface DeviceInfo {
  deviceName: string;
  osVersion: string;
  appVersion: string;
  platform: string;
  deviceId?: string;
}

/**
 * Log entry received from a Flutter application.
 */
export interface LogEntry {
  device_info: DeviceInfo;
  level: LogLevel;
  timestamp: string;
  context: string;
  payload: unknown;
}

/**
 * API response wrapper.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}