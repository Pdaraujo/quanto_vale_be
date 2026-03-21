import { Injectable, LoggerService as NestLogger } from "@nestjs/common";
import * as winston from "winston";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class LoggerService implements NestLogger {
    private logger: winston.Logger;

    constructor(private readonly configService: ConfigService) {
        const isDevelopment =
            this.configService.getOrThrow("environment") === "development";

        const { combine, timestamp, json, colorize, printf } = winston.format;

        const logFormat = isDevelopment
            ? combine(
                  colorize(),
                  timestamp(),
                  printf(({ level, message, context, meta }) => {
                      return `${level} [${context}] ${message} ${meta ? JSON.stringify(meta) : ""}`;
                  }),
              )
            : combine(timestamp(), json());

        this.logger = winston.createLogger({
            format: logFormat,
            transports: [
                new winston.transports.Console(),
                // Add other transports like file or cloud-based logging solutions
            ],
        });
    }
    log(message: any, context?: string, meta?: any) {
        this.logger.info(message, {
            context,
            meta,
        });
    }

    error(message: any, trace?: string, context?: string, meta?: any) {
        this.logger.error(message, {
            context,
            trace,
            meta,
        });
    }

    warn(message: any, context?: string, meta?: any) {
        this.logger.warn(message, {
            context,
            meta,
        });
    }

    debug(message: any, context?: string, meta?: any) {
        this.logger.debug(message, {
            context,
            meta,
        });
    }

    verbose(message: any, context?: string, meta?: any) {
        this.logger.verbose(message, {
            context,
            meta,
        });
    }
}
