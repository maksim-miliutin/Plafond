import { Relocation } from "../../components/Relocation";
import { indexFromDisk, metropoleFromDisk, regionFromDisk, relocationRulesFromDisk, zoneListsFromDisk } from "../../lib/disk";
import { packRegion } from "../../lib/region";
import { pageMetadata } from "../../lib/site";

export const metadata = pageMetadata("relocation/");

export default function RentOnReletting()
{
    const metropole = metropoleFromDisk();
    const rules = {
        communes: packRegion(regionFromDisk(), metropole),
        lists: zoneListsFromDisk(),
        capped: metropole.filter((commune) => commune.territory !== null).map((commune) => commune.code),
        periods: relocationRulesFromDisk(),
        index: indexFromDisk().rows,
    };

    return <Relocation rules={rules} />;
}
