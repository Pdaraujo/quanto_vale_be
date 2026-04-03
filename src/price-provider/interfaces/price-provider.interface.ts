import { Product } from './product.interface';

export interface PriceProvider {
    getProducts(query: string): Promise<Product[]>;
}
