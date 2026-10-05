import { DistrictPage } from "../../../components/DistrictPage";
import { fromDisk } from "../../../lib/disk";
import { SiteError, districtMetadata } from "../../../lib/site";

interface Route
{
    params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams()
{
    return fromDisk().districts.map((district) => ({ slug: district.slug }));
}

export async function generateMetadata({ params }: Route)
{
    return districtMetadata(districtAt((await params).slug));
}

export default async function Arrondissement({ params }: Route)
{
    return <DistrictPage district={districtAt((await params).slug)} />;
}

function districtAt(slug: string)
{
    const district = fromDisk().districts.find((known) => known.slug === slug);
    if (district === undefined)
    {
        throw new SiteError(`no arrondissement is called "${slug}"`);
    }

    return district;
}
