import { Plafond } from "../../components/Plafond";
import { lawFromDisk } from "../../lib/disk";
import { pageMetadata } from "../../lib/site";

export const metadata = pageMetadata("loyer/");

export default function Rent()
{
    return <Plafond law={lawFromDisk()} />;
}
