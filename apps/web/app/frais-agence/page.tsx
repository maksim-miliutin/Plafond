import { Honoraires } from "../../components/Honoraires";
import { feeCapsFromDisk, metropoleFromDisk, regionFromDisk, zoneListsFromDisk } from "../../lib/disk";
import { packRegion } from "../../lib/region";
import { pageMetadata } from "../../lib/site";

export const metadata = pageMetadata("frais-agence/");

export default function AgencyFees()
{
    return <Honoraires caps={feeCapsFromDisk()} zones={{ communes: packRegion(regionFromDisk(), metropoleFromDisk()), lists: zoneListsFromDisk() }} />;
}
