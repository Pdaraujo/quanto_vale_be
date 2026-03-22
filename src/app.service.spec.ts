import { Test, TestingModule } from "@nestjs/testing";
import { AppService } from "./app.service";
import { CacheService } from "./core/cache/cache.service";
import { LoggerService } from "./core/logger/logger.service";
import { createMock } from "@golevelup/ts-jest";

describe("AppService", () => {
    let appService: AppService;

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            providers: [
                AppService,
                {
                    provide: LoggerService,
                    useValue: createMock<LoggerService>(),
                },
                {
                    provide: CacheService,
                    useValue: createMock<CacheService>(),
                }
            ],
        }).compile();

        appService = app.get<AppService>(AppService);
    });

    describe("root", () => {
        it('should return "Hello World!"', async () => {
            const getHello = await appService.getHello();
            expect(getHello).toBe("Hello World!");
        });
    });
});
