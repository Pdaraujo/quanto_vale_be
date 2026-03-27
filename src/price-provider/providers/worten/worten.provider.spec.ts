import { Test, TestingModule } from '@nestjs/testing';
import { WortenProvider } from './worten.provider';
import { PriceProvider } from '../../interfaces/price-provider.interface';
import { PROVIDER_CONFIG } from '../../price-provider.constants';

describe('WortenProvider', () => {
    let provider: WortenProvider;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                WortenProvider,
                {
                    provide: PROVIDER_CONFIG,
                    useValue: { url: 'https://www.worten.pt' },
                },
            ],
        }).compile();

        provider = module.get<WortenProvider>(WortenProvider);
    });

    it('should implement the PriceProvider interface', () => {
        const asInterface: PriceProvider = provider;
        expect(typeof asInterface.getPrice).toBe('function');
    });

    it('should be configured with the worten URL', () => {
        expect(provider.config.url).toBe('https://www.worten.pt');
    });

    it('should return a number when getPrice is called', async () => {
        const result = await provider.getPrice('some-product-id');
        expect(typeof result).toBe('number');
    });
});
