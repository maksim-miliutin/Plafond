import { FeeCapsTable } from "../../../components/FeeCapsTable";
import { Guide } from "../../../components/Guide";
import { feeCapsFromDisk } from "../../../lib/disk";
import { guides } from "../../../lib/guides";
import { pageMetadata } from "../../../lib/site";

export const metadata = pageMetadata("guides/frais-d-agence/");

export default function AgencyFeesGuide()
{
    return <Guide guide={guides.find((guide) => guide.slug === "frais-d-agence")!} more={<FeeCapsTable caps={feeCapsFromDisk()} />} />;
}
