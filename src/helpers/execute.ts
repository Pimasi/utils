export function execute(
    handler: () => void,
    context: Record<string, string> = {},
): void {
    let _handler = async () => {
        try {
            await handler();
            process.exit(0);
        } catch (err) {
            console.error(err);
            process.exit(1);
        }
    };

    _handler();
}
