import { IleDeFrance } from "../../components/IleDeFrance";
import { metropoleFromDisk, regionFromDisk } from "../../lib/disk";
import { packRegion } from "../../lib/region";
import { pageMetadata } from "../../lib/site";

export const metadata = pageMetadata("ile-de-france/");

export default function Region()
{
    const region = regionFromDisk();
    const metropole = metropoleFromDisk();
    const capped = metropole.filter((commune) => commune.territory !== null).map((commune) => commune.code);

    return <IleDeFrance communes={packRegion(region, metropole)} count={region.length} capped={capped} />;
}
