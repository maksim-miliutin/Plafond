import { Indexation } from "../../components/Indexation";
import { indexFromDisk } from "../../lib/disk";
import { pageMetadata } from "../../lib/site";

export const metadata = pageMetadata("revision/");

export default function RentRevision()
{
    return <Indexation index={indexFromDisk().rows} />;
}
