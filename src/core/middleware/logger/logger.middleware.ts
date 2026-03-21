import { Injectable, NestMiddleware } from "@nestjs/common";
import { LoggerService } from "../../logger/logger.service";

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    constructor(private readonly logger: LoggerService) {}
    use(req: any, res: any, next: () => void) {
        const start = Date.now();
        const { method, url, headers, query, body } = req;

        res.on("finish", () => {
            const responseTime = Date.now() - start;
            const message = `${method} ${url} ${res.statusCode} ${responseTime}ms`;
            const statusCode = res.statusCode;
            const logData = {
                responseTime,
                method,
                url,
                headers,
                query,
                body,
            };

            if (statusCode >= 500) {
                this.logger.error(message, undefined, `HTTP`, logData);
            } else if (statusCode >= 400) {
                this.logger.warn(message, `HTTP`, logData);
            } else {
                this.logger.log(message, `HTTP`, logData);
            }
        });
        next();
    }
}
