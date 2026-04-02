export type Handler<R = any> = (payload: R) => void;
export type OnEventHandler<T = any, R = any> = (event: T, payload: R) => void;
export type Observable = ReturnType<typeof Observable>;

export function Observable<T extends string = string, R = any>() {
    const _handlers: Record<string, Set<Handler<R>>> = {};
    const _globalEventHandlers: Set<OnEventHandler<T>> = new Set();

    function getHandler(event: string) {
        if (!_handlers[event]) {
            _handlers[event] = new Set();
        }

        return _handlers[event];
    }

    return {
        emit(
            ...args: R extends undefined | void
                ? [event: T]
                : [event: T, payload: R]
        ): void {
            const [event, payload] = args as [T, R];

            getHandler(event).forEach((handler) => handler(payload));

            _globalEventHandlers.forEach((handler) => handler(event, payload));
        },

        on(event: T, handler: Handler<R>): void {
            if (getHandler(event).has(handler)) return;

            getHandler(event).add(handler);
        },

        onEvent(handler: OnEventHandler<T, R>): void {
            if (_globalEventHandlers.has(handler)) return;

            _globalEventHandlers.add(handler);
        },

        once(event: T, handler: Handler<R>): void {
            let onTrigger: Handler<R> = (payload) => {
                handler(payload);

                getHandler(event).delete(onTrigger);
            };

            getHandler(event).add(onTrigger);
        },

        off(event: T, handler: Handler<R>): void {
            if (getHandler(event).has(handler)) {
                getHandler(event).delete(handler);
            }
        },
    } as const;
}
