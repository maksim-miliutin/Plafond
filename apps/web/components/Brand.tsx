// The icon lives at the root of the site, empty locally and /Plafond on GitHub Pages, whichever page shows it.
const siteRoot = process.env.NEXT_PUBLIC_SITE_ROOT ?? "";

export function Brand()
{
    return (
        <p className="brand">
            <img src={`${siteRoot}/icon-192.png`} alt="" width={40} height={40} />
            <span>Plafond</span>
        </p>
    );
}
