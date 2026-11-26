import { Honoraires } from "../../components/Honoraires";
import { checkedCommunesFromDisk, feeCapsFromDisk, metropoleFromDisk, zoneListsFromDisk } from "../../lib/disk";
import { packRegion } from "../../lib/region";
import { pageMetadata } from "../../lib/site";

export const metadata = pageMetadata("frais-agence/");

export default function AgencyFees()
{
    return <Honoraires caps={feeCapsFromDisk()} zones={{ communes: packRegion(checkedCommunesFromDisk().communes, metropoleFromDisk()), lists: zoneListsFromDisk() }} />;
}
