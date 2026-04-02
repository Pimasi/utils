export async function parallelize<T = any>({
    queue,
    handler,
    workers,
}: {
    queue: T[];
    handler: (val: T) => void;
    workers: number;
}) {
    await Promise.all(
        Array(workers)
            .fill(undefined)
            .map(async () => {
                let item;

                while ((item = queue.pop())) {
                    await handler(item);
                }
            }),
    );
}
