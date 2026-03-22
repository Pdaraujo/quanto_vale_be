import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "../src/app.module";
import { CacheService } from "../src/core/cache/cache.service";
import helmet from "helmet";

let app: INestApplication;
let server: any;
let moduleFixture: TestingModule;
let cache: CacheService;

beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
        imports: [AppModule],
    }).compile();

    // Apply consistent set up to main.ts
    app = moduleFixture.createNestApplication();
    app.use(helmet());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

    // Get instances of services
    cache = moduleFixture.get<CacheService>(CacheService);

    await app.init();
    server = app.getHttpServer();
});

afterEach(async () => {
    await cache.reset();
});

afterAll(async () => {
    await app.close();
});

export { server, app };
