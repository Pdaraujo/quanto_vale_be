import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { CoreModule } from "./core/core.module";
import { PriceProviderModule } from './price-provider/price-provider.module';

@Module({
    imports: [CoreModule, PriceProviderModule],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
