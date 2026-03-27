import { Module } from '@nestjs/common';
import { WortenProvider } from './providers/worten/worten.provider';
import { PROVIDER_CONFIG } from './price-provider.constants';

@Module({
    providers: [
        {
            provide: PROVIDER_CONFIG,
            useValue: { url: 'https://www.worten.pt' },
        },
        WortenProvider,
    ],
    exports: [WortenProvider],
})
export class PriceProviderModule {}
