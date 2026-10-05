import { QuartierPage } from "../../../components/QuartierPage";
import { fromDisk } from "../../../lib/disk";
import { SiteError, placeMetadata } from "../../../lib/site";

interface Route
{
    params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams()
{
    return fromDisk().places.map((place) => ({ slug: place.slug }));
}

export async function generateMetadata({ params }: Route)
{
    return placeMetadata(placeAt((await params).slug));
}

export default async function Quartier({ params }: Route)
{
    return <QuartierPage place={placeAt((await params).slug)} />;
}

function placeAt(slug: string)
{
    const place = fromDisk().places.find((known) => known.slug === slug);
    if (place === undefined)
    {
        throw new SiteError(`no quartier is called "${slug}"`);
    }

    return place;
}
