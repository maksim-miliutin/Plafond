import { LyonPage } from "../../../components/LyonPage";
import { fromDisk } from "../../../lib/disk";
import { SiteError, communeMetadata } from "../../../lib/site";

interface Route
{
    params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams()
{
    return fromDisk().communes.map((commune) => ({ slug: commune.slug }));
}

export async function generateMetadata({ params }: Route)
{
    return communeMetadata(communeAt((await params).slug));
}

export default async function Commune({ params }: Route)
{
    return <LyonPage commune={communeAt((await params).slug)} />;
}

function communeAt(slug: string)
{
    const commune = fromDisk().communes.find((known) => known.slug === slug);
    if (commune === undefined)
    {
        throw new SiteError(`no commune of Lyon is called "${slug}"`);
    }

    return commune;
}
