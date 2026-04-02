export interface InterceptorOptions {
    synchronous?: boolean;
    runWhen?: (config: any) => boolean;
}

export interface InterceptorManager<V> {
    use(
        onFulfilled?: ((value: V) => V | Promise<V>) | null,
        onRejected?: ((error: any) => any) | null,
        options?: InterceptorOptions,
    ): number;
    eject(id: number): void;
    clear(): void;
}

interface Interceptor<V> {
    fulfilled?: ((value: V) => V | Promise<V>) | null;
    rejected?: ((error: any) => any) | null;
    runWhen?: ((config: any) => boolean) | null;
    synchronous?: boolean;
}

export function createInterceptorManager<V>(): InterceptorManager<V> & {
    handlers: (Interceptor<V> | null)[];
} {
    const handlers: (Interceptor<V> | null)[] = [];

    return {
        handlers,
        use(onFulfilled, onRejected, options) {
            handlers.push({
                fulfilled: onFulfilled,
                rejected: onRejected,
                runWhen: options?.runWhen,
                synchronous: options?.synchronous,
            });
            return handlers.length - 1;
        },
        eject(id) {
            if (handlers[id]) {
                handlers[id] = null;
            }
        },
        clear() {
            handlers.length = 0;
        },
    };
}
