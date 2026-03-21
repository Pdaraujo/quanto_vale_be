import { Injectable } from "@nestjs/common";
import { DatabaseService } from "./database/database.service";
import { CacheService } from "./core/cache/cache.service";

@Injectable()
export class AppService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly cacheService: CacheService,
    ) {}
    async getHello() {
        this.databaseService.user.findMany();
        await this.cacheService.set("key", "Value from cache", 1000);
        const fromCache = await this.cacheService.get("key");
        console.log("This is from cache", fromCache);
        return "Hello World!";
    }
}
