import { Inject, Injectable } from '@nestjs/common';
import { PriceProvider } from '../../interfaces/price-provider.interface';
import { ProviderConfig } from '../../interfaces/provider-config.interface';
import { PROVIDER_CONFIG } from '../../price-provider.constants';

@Injectable()
export class WortenProvider implements PriceProvider {
    constructor(
        @Inject(PROVIDER_CONFIG) public readonly config: ProviderConfig,
    ) {}

    async getPrice(_productId: string): Promise<number> {
        return 0;
    }
}
