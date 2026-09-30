export type Copied = "copied" | "refused";

export async function copy(text: string, clipboard: Pick<Clipboard, "writeText"> | undefined): Promise<Copied>
{
    // Browsers leave out the clipboard on pages served without https, and may deny it on any page.
    if (clipboard === undefined)
    {
        return "refused";
    }

    try
    {
        await clipboard.writeText(text);

        return "copied";
    }
    catch
    {
        return "refused";
    }
}
