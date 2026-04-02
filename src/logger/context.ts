export function LogContext(context: any) {
    let weakSet = new WeakSet();

    const recursiveReduce = (context: any): any => {
        if (context?.isAxiosError) {
            return recursiveReduce({
                req: {
                    headers: context.config?.headers,
                    method: context.config?.method,
                    url: context.config?.url,
                    params: context.config?.params,
                    data: context.config?.data,
                },
                res: {
                    headers: context.response?.headers,
                    status: context.response?.status,
                    data: context.response?.data,
                },
            });
        } else if (context instanceof Error) {
            return {
                ...context,
                stack: context?.stack?.split(`\n`).map((entry) => entry.trim()),
            };
        } else if (Buffer.isBuffer(context)) {
            return `[Buffer]: ${context.byteLength}`;
        } else if (typeof context === "bigint") {
            return `[BigInt]: ${context.toString()}`;
        } else if (typeof context?.toISOString === "function") {
            return `[Date]: ${context.toISOString()}`;
        } else if (Array.isArray(context)) {
            return context.map(recursiveReduce);
        } else if (typeof context === "function") {
            return `[Function: ${(context as Function).name || undefined}]`;
        } else if (typeof context === "symbol") {
            return context.toString();
        } else if (typeof context === "object" && Boolean(context)) {
            if (weakSet.has(context)) {
                let name = context.constructor?.name;
                return name && name !== "Object"
                    ? `[Reference: ${name}]`
                    : `[Reference]`;
            }
            weakSet.add(context);
            return Object.entries(context).reduce(
                (aggregate, [key, value]) => {
                    aggregate[key] = recursiveReduce(value);
                    return aggregate;
                },
                {} as Record<string | number, any>,
            );
        } else {
            return context;
        }
    };

    return recursiveReduce(context);
}
