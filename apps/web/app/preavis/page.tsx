import { Preavis } from "../../components/Preavis";
import { grandParisZonesFromDisk, zoneListsFromDisk } from "../../lib/disk";
import { pageMetadata } from "../../lib/site";

export const metadata = pageMetadata("preavis/");

export default function Notice()
{
    return <Preavis zones={{ communes: grandParisZonesFromDisk(), lists: zoneListsFromDisk() }} />;
}
