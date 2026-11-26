import { Relocation } from "../../components/Relocation";
import { checkedCommunesFromDisk, indexFromDisk, metropoleFromDisk, relocationRulesFromDisk, zoneListsFromDisk } from "../../lib/disk";
import { packRegion } from "../../lib/region";
import { pageMetadata } from "../../lib/site";

export const metadata = pageMetadata("relocation/");

export default function RentOnReletting()
{
    const checked = checkedCommunesFromDisk();
    const rules = {
        communes: packRegion(checked.communes, metropoleFromDisk()),
        lists: zoneListsFromDisk(),
        capped: checked.capped,
        periods: relocationRulesFromDisk(),
        index: indexFromDisk().rows,
    };

    return <Relocation rules={rules} />;
}
