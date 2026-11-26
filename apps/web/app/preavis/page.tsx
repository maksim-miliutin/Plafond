import { Preavis } from "../../components/Preavis";
import { checkedCommunesFromDisk, metropoleFromDisk, zoneListsFromDisk } from "../../lib/disk";
import { packRegion } from "../../lib/region";
import { pageMetadata } from "../../lib/site";

export const metadata = pageMetadata("preavis/");

export default function Notice()
{
    return <Preavis zones={{ communes: packRegion(checkedCommunesFromDisk().communes, metropoleFromDisk()), lists: zoneListsFromDisk() }} />;
}
