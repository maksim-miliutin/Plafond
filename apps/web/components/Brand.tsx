// The icon lives at the root of the site, empty both locally and on leplafond.org, whichever page shows it.
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
