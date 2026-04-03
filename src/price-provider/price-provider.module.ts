import { Module } from '@nestjs/common';
import { WortenProvider } from './providers/worten/worten.provider';
import { PriceProviderController } from './price-provider.controller';

@Module({
    providers: [WortenProvider],
    exports: [WortenProvider],
    controllers: [PriceProviderController],
})
export class PriceProviderModule {}
