export interface PriceProvider {
    getPrice(productId: string): Promise<number>;
}
