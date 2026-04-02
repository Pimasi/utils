import { sleep } from "./sleep";

export interface RetryOptions {
    tries?: number;
    factor?: number;
    baseDelay?: number;
}

/**
 * @param factor integer denominator for exponential backoff, defaults to 1. A factor of one means no exponential backoff, i.e. a constant delay between retries. A factor of 2 means the delay doubles with each retry, etc.
 * @param baseDelay base delay in ms, defaults to 100
 * @param tries defaults to 3
 */
export function retry<T>(
    handler: () => T,
    { tries = 3, factor = 1, baseDelay = 100 }: RetryOptions = {},
) {
    let retrier = async (attempt = 0): Promise<Awaited<T>> => {
        try {
            return await handler();
        } catch (err) {
            if (attempt >= tries) throw err;

            let waitTime = Math.floor(
                baseDelay * Math.pow(factor, attempt + 1) + 50 * Math.random(),
            );

            await sleep(waitTime);

            return retrier(attempt + 1);
        }
    };

    return retrier();
}
