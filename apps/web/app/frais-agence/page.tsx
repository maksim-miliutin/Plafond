import { Honoraires } from "../../components/Honoraires";
import { feeCapsFromDisk, grandParisZonesFromDisk, zoneListsFromDisk } from "../../lib/disk";
import { pageMetadata } from "../../lib/site";

export const metadata = pageMetadata("frais-agence/");

export default function AgencyFees()
{
    return <Honoraires caps={feeCapsFromDisk()} zones={{ communes: grandParisZonesFromDisk(), lists: zoneListsFromDisk() }} />;
}
