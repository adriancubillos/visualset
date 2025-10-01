/**
 * Centralized logging utility for the application
 * Provides consistent logging with optional future enhancements like:
 * - Log levels (debug, info, warn, error)
 * - Remote logging services
 * - Log formatting
 * - Environment-based logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
    enableConsole: boolean;
    enableRemote: boolean;
    minLevel: LogLevel;
}

const config: LoggerConfig = {
    enableConsole: true,
    enableRemote: false, // Can be enabled for production monitoring
    minLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
};

const logLevels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

class Logger {
    private shouldLog(level: LogLevel): boolean {
        return logLevels[level] >= logLevels[config.minLevel];
    }

    private formatMessage(level: LogLevel, message: string, data?: unknown): string {
        const timestamp = new Date().toISOString();
        const dataStr = data ? ` | ${JSON.stringify(data)}` : '';
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${dataStr}`;
    }

    debug(message: string, data?: unknown): void {
        if (!this.shouldLog('debug')) return;

        if (config.enableConsole) {
            console.debug(this.formatMessage('debug', message, data));
        }
    }

    info(message: string, data?: unknown): void {
        if (!this.shouldLog('info')) return;

        if (config.enableConsole) {
            console.info(this.formatMessage('info', message, data));
        }
    }

    warn(message: string, data?: unknown): void {
        if (!this.shouldLog('warn')) return;

        if (config.enableConsole) {
            console.warn(this.formatMessage('warn', message, data));
        }
    }

    error(message: string, error?: unknown): void {
        if (!this.shouldLog('error')) return;

        if (config.enableConsole) {
            console.error(this.formatMessage('error', message, error));
        }

        // Future: Send to remote logging service
        if (config.enableRemote) {
            // this.sendToRemote('error', message, error);
        }
    }

    // Convenience method for API errors
    apiError(operation: string, endpoint: string, error: unknown): void {
        this.error(`API Error: ${operation} failed for ${endpoint}`, error);
    }

    // Convenience method for database errors
    dbError(operation: string, table: string, error: unknown): void {
        this.error(`Database Error: ${operation} failed for ${table}`, error);
    }
}

// Export singleton instance
export const logger = new Logger();

// Export for testing or custom instances
export { Logger };
