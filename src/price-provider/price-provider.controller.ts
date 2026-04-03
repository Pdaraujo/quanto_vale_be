import { Controller, Get, Query } from '@nestjs/common';
import { WortenProvider } from './providers/worten/worten.provider';

@Controller('price-provider')
export class PriceProviderController {
    constructor(private readonly wortenProvider: WortenProvider) {}

    @Get('search')
    search(@Query('query') query: string) {
        return this.wortenProvider.getProducts(query);
    }
}
