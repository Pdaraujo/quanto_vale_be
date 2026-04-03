export default () => ({
    environment: process.env.NODE_ENV || "development",
    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        username: process.env.REDIS_USERNAME,
        password: process.env.REDIS_PASSWORD,
    },
    worten: {
        baseUrl: process.env.WORTEN_BASE_URL || 'https://www.worten.pt',
        pageSize: parseInt(process.env.WORTEN_PAGE_SIZE ?? '12', 10),
    },
});
