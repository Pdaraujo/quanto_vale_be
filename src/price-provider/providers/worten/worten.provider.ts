import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Session, ClientIdentifier, initTLS, destroyTLS } from 'node-tls-client';
import { PriceProvider } from '../../interfaces/price-provider.interface';
import { Product } from '../../interfaces/product.interface';
import { CacheService } from '../../../core/cache/cache.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { WortenCookieError } from './errors/worten-cookie.error';
import { WortenSearchError } from './errors/worten-search.error';

const CACHE_TTL_SECONDS = 3600;
const SEARCH_GRAPHQL_HASH = 'dd3908fc143960ebb11e8e5ae798ad0877a0c5913866875c6bd03fee29f0c71e';

interface SearchHit {
    product: {
        name: string;
        url: string;
        image: { url: string };
    };
    winningOffer: {
        pricing: {
            final: { value: string };
        };
    } | null;
}

interface SearchResponse {
    data: {
        searchProductsV2: {
            hits: SearchHit[];
        };
    };
}

@Injectable()
export class WortenProvider implements PriceProvider, OnModuleInit, OnModuleDestroy {
    private session: Session;
    private sessionReady = false;
    private readonly baseUrl: string;
    private readonly pageSize: number;

    constructor(
        private readonly configService: ConfigService,
        private readonly cacheService: CacheService,
        private readonly logger: LoggerService,
    ) {
        this.baseUrl = this.configService.get<string>('worten.baseUrl', 'https://www.worten.pt');
        this.pageSize = this.configService.get<number>('worten.pageSize', 12);
    }

    async onModuleInit(): Promise<void> {
        await initTLS();
        this.session = new Session({ clientIdentifier: ClientIdentifier.chrome_120 });
    }

    async onModuleDestroy(): Promise<void> {
        await this.session?.close();
        await destroyTLS();
    }

    async getProducts(query: string): Promise<Product[]> {
        const cacheKey = `worten:search:${query}`;
        const cached = await this.cacheService.get<Product[]>(cacheKey);
        if (cached) return cached;

        if (!this.sessionReady) {
            await this.warmUpSession();
        }

        const products = await this.search(query);
        await this.cacheService.set(cacheKey, products, CACHE_TTL_SECONDS);
        return products;
    }

    protected async warmUpSession(): Promise<void> {
        try {
            await this.session.get(this.baseUrl, { followRedirects: true });
        } catch (err) {
            throw new WortenCookieError(`Failed to reach Worten homepage: ${(err as Error).message}`);
        }
        this.sessionReady = true;
    }

    private async search(query: string, isRetry = false): Promise<Product[]> {
        const payload = {
            operationName: 'searchProducts',
            variables: {
                textProperties: ['energy-class', 'energy-class-new', 'release-date', 'purchase-code', 'retek_cc_7714'],
                includeTextProperties: true,
                query,
                params: {
                    pageNumber: 0,
                    pageSize: this.pageSize,
                    filters: [],
                    sort: { field: 'rank1', order: 'ASC' },
                    collapse: true,
                    favoriteStores: [],
                    debug: false,
                },
                hasVariants: true,
            },
            extensions: {
                persistedQuery: { version: 1, sha256Hash: SEARCH_GRAPHQL_HASH },
            },
        };

        let result: { status: number; body: string };
        try {
            result = await this.doPost(
                `${this.baseUrl}/_/api/graphql?wOperationName=searchProducts`,
                payload,
                {
                    'origin': this.baseUrl,
                    'referer': `${this.baseUrl}/search?query=${encodeURIComponent(query)}`,
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-origin',
                },
            );
        } catch (err) {
            throw new WortenSearchError(`Network error calling search API: ${(err as Error).message}`);
        }

        if ((result.status === 401 || result.status === 403) && !isRetry) {
            this.logger.warn(`Search returned ${result.status}, re-acquiring session and retrying`, WortenProvider.name);
            this.sessionReady = false;
            await this.warmUpSession();
            return this.search(query, true);
        }

        if (result.status < 200 || result.status >= 300) {
            throw new WortenSearchError(`Worten search API returned ${result.status}`, result.status);
        }

        const body: SearchResponse = JSON.parse(result.body);
        const hits = body?.data?.searchProductsV2?.hits ?? [];

        return hits.map(hit => ({
            name: hit.product?.name ?? '',
            price: hit.winningOffer ? parseInt(hit.winningOffer.pricing.final.value, 10) / 100 : 0,
            url: `${this.baseUrl}${hit.product?.url ?? ''}`,
            imageUrl: hit.product?.image?.url ?? '',
        }));
    }

    protected async doPost(url: string, body: Record<string, unknown>, extraHeaders: Record<string, string> = {}): Promise<{ status: number; body: string }> {
        const response = await this.session.post(url, {
            body: JSON.stringify(body),
            headers: {
                'content-type': 'application/json',
                'accept': 'application/json',
                'accept-language': 'pt-PT,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                ...extraHeaders,
            },
        });
        return { status: response.status, body: response.body };
    }
}
