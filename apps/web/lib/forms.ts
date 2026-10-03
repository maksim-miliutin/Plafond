export function readForm<K extends string>(sent: FormData, keys: readonly K[]): Record<K, string>
{
    const read = (key: K) =>
    {
        const value = sent.get(key);

        return typeof value === "string" ? value : "";
    };

    return Object.fromEntries(keys.map((key) => [key, read(key)])) as Record<K, string>;
}
