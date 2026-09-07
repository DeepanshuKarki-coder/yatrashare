export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogPayload {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  requestId?: string;
  data?: any;
  error?: {
    message: string;
    stack?: string;
  };
}

class Logger {
  private format(level: LogLevel, message: string, context?: string, data?: any, error?: Error): LogPayload {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(context && { context }),
      ...(data && { data }),
      ...(error && {
        error: {
          message: error.message,
          stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
        },
      }),
    };
  }

  info(message: string, context?: string, data?: any) {
    const log = this.format(LogLevel.INFO, message, context, data);
    console.log(JSON.stringify(log));
  }

  warn(message: string, context?: string, data?: any) {
    const log = this.format(LogLevel.WARN, message, context, data);
    console.warn(JSON.stringify(log));
  }

  error(message: string, error?: Error | any, context?: string, data?: any) {
    const errObj = error instanceof Error ? error : error ? new Error(String(error)) : undefined;
    const log = this.format(LogLevel.ERROR, message, context, data, errObj);
    console.error(JSON.stringify(log));
  }

  debug(message: string, context?: string, data?: any) {
    if (process.env.NODE_ENV !== 'production') {
      const log = this.format(LogLevel.DEBUG, message, context, data);
      console.debug(JSON.stringify(log));
    }
  }
}

export const logger = new Logger();
