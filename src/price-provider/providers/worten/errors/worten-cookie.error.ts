export class WortenCookieError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'WortenCookieError';
    }
}
