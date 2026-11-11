import { Honoraires } from "../../components/Honoraires";
import { feeCapsFromDisk } from "../../lib/disk";
import { pageMetadata } from "../../lib/site";

export const metadata = pageMetadata("frais-agence/");

export default function AgencyFees()
{
    return <Honoraires caps={feeCapsFromDisk()} />;
}
