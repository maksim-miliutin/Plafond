import { Relocation } from "../../components/Relocation";
import { grandParisZonesFromDisk, indexFromDisk, metropoleFromDisk, relocationRulesFromDisk, zoneListsFromDisk } from "../../lib/disk";
import { pageMetadata } from "../../lib/site";

export const metadata = pageMetadata("relocation/");

export default function RentOnReletting()
{
    const world = {
        communes: grandParisZonesFromDisk(),
        lists: zoneListsFromDisk(),
        capped: metropoleFromDisk().filter((commune) => commune.territory !== null).map((commune) => commune.code),
        periods: relocationRulesFromDisk(),
        index: indexFromDisk().rows,
    };

    return <Relocation world={world} />;
}
