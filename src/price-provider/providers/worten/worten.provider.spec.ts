jest.mock('node-tls-client', () => ({
    initTLS: jest.fn().mockResolvedValue(undefined),
    destroyTLS: jest.fn().mockResolvedValue(undefined),
    ClientIdentifier: { chrome_120: 'chrome_120' },
    Session: jest.fn().mockImplementation(() => ({
        get: jest.fn().mockResolvedValue({ status: 200, body: '' }),
        post: jest.fn().mockResolvedValue({ status: 200, body: '' }),
        close: jest.fn().mockResolvedValue(undefined),
    })),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { WortenProvider } from './worten.provider';
import { PriceProvider } from '../../interfaces/price-provider.interface';
import { CacheService } from '../../../core/cache/cache.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { WortenCookieError } from './errors/worten-cookie.error';
import { WortenSearchError } from './errors/worten-search.error';

const BASE_URL = 'https://www.worten.pt';
const PAGE_SIZE = 5;

const mockConfigService = {
    get: (key: string, defaultValue?: any) => {
        if (key === 'worten.baseUrl') return BASE_URL;
        if (key === 'worten.pageSize') return PAGE_SIZE;
        return defaultValue;
    },
};

const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
};

const mockLoggerService = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
};

const makeSearchBody = (hits: any[]) =>
    JSON.stringify({ data: { searchProductsV2: { hits } } });

const makeHit = (overrides: Partial<{ name: string; url: string; imageUrl: string; priceValue: string }> = {}) => ({
    product: {
        name: overrides.name ?? 'iPhone 17',
        url: overrides.url ?? '/produtos/iphone-17-8600278',
        image: { url: overrides.imageUrl ?? 'https://www.worten.pt/i/abc123' },
    },
    winningOffer: {
        pricing: { final: { value: overrides.priceValue ?? '89999' } },
    },
});

describe('WortenProvider', () => {
    let provider: WortenProvider;

    beforeEach(async () => {
        jest.clearAllMocks();
        mockCacheService.get.mockResolvedValue(undefined);
        mockCacheService.set.mockResolvedValue(undefined);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                WortenProvider,
                { provide: ConfigService, useValue: mockConfigService },
                { provide: CacheService, useValue: mockCacheService },
                { provide: LoggerService, useValue: mockLoggerService },
            ],
        }).compile();

        provider = module.get<WortenProvider>(WortenProvider);
    });

    it('should implement the PriceProvider interface', () => {
        const asInterface: PriceProvider = provider;
        expect(typeof asInterface.getProducts).toBe('function');
    });

    it('should return cached results without warming up session or calling doPost', async () => {
        const cached = [{ name: 'iPhone', price: 899.99, url: 'http://x', imageUrl: '' }];
        mockCacheService.get.mockResolvedValueOnce(cached);
        const warmUpSpy = jest.spyOn(provider as any, 'warmUpSession');
        const postSpy = jest.spyOn(provider as any, 'doPost');

        const result = await provider.getProducts('iphone');

        expect(result).toBe(cached);
        expect(warmUpSpy).not.toHaveBeenCalled();
        expect(postSpy).not.toHaveBeenCalled();
    });

    it('should warm up session on first call and return mapped products', async () => {
        const warmUpSpy = jest.spyOn(provider as any, 'warmUpSession').mockResolvedValueOnce(undefined);
        const postSpy = jest.spyOn(provider as any, 'doPost').mockResolvedValueOnce({
            status: 200,
            body: makeSearchBody([makeHit()]),
        });

        const result = await provider.getProducts('iphone 17');

        expect(warmUpSpy).toHaveBeenCalledTimes(1);
        expect(postSpy).toHaveBeenCalledTimes(1);
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            name: 'iPhone 17',
            price: 899.99,
            url: `${BASE_URL}/produtos/iphone-17-8600278`,
            imageUrl: 'https://www.worten.pt/i/abc123',
        });
    });

    it('should divide price value by 100 to convert from cents', async () => {
        jest.spyOn(provider as any, 'warmUpSession').mockResolvedValueOnce(undefined);
        jest.spyOn(provider as any, 'doPost').mockResolvedValueOnce({
            status: 200,
            body: makeSearchBody([makeHit({ priceValue: '125900' })]),
        });

        const result = await provider.getProducts('macbook');

        expect(result[0]!.price).toBe(1259);
    });

    it('should cache results after a successful search', async () => {
        jest.spyOn(provider as any, 'warmUpSession').mockResolvedValueOnce(undefined);
        jest.spyOn(provider as any, 'doPost').mockResolvedValueOnce({
            status: 200,
            body: makeSearchBody([]),
        });

        await provider.getProducts('iphone');

        expect(mockCacheService.set).toHaveBeenCalledWith(
            'worten:search:iphone',
            expect.any(Array),
            3600,
        );
    });

    it('should throw WortenSearchError when search API returns non-2xx', async () => {
        jest.spyOn(provider as any, 'warmUpSession').mockResolvedValueOnce(undefined);
        jest.spyOn(provider as any, 'doPost').mockResolvedValueOnce({ status: 500, body: '' });

        await expect(provider.getProducts('iphone')).rejects.toThrow(WortenSearchError);
    });

    it('should throw WortenCookieError when session warm-up fails', async () => {
        jest.spyOn(provider as any, 'warmUpSession').mockRejectedValueOnce(new WortenCookieError('Failed to reach Worten homepage: connection refused'));

        await expect(provider.getProducts('iphone')).rejects.toThrow(WortenCookieError);
    });

    it('should re-acquire session and retry once on 401', async () => {
        const warmUpSpy = jest
            .spyOn(provider as any, 'warmUpSession')
            .mockResolvedValueOnce(undefined)
            .mockResolvedValueOnce(undefined);

        jest.spyOn(provider as any, 'doPost')
            .mockResolvedValueOnce({ status: 401, body: '' })
            .mockResolvedValueOnce({ status: 200, body: makeSearchBody([makeHit()]) });

        await provider.getProducts('iphone 17');

        expect(warmUpSpy).toHaveBeenCalledTimes(2);
    });

    it('should return 0 price when winningOffer is null', async () => {
        const hitWithNoOffer = { ...makeHit(), winningOffer: null };
        jest.spyOn(provider as any, 'warmUpSession').mockResolvedValueOnce(undefined);
        jest.spyOn(provider as any, 'doPost').mockResolvedValueOnce({
            status: 200,
            body: makeSearchBody([hitWithNoOffer]),
        });

        const result = await provider.getProducts('iphone');

        expect(result[0]!.price).toBe(0);
    });
});
