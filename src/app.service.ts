import { Injectable } from "@nestjs/common";
import { CacheService } from "./core/cache/cache.service";

@Injectable()
export class AppService {
    constructor(private readonly cacheService: CacheService) {}
    async getHello() {
        await this.cacheService.set("key", "Value from cache", 1000);
        const fromCache = await this.cacheService.get("key");
        console.log("This is from cache", fromCache);
        return "Hello World!";
    }
}
