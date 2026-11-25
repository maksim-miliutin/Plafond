import { GrandParis } from "../../components/GrandParis";
import { grandParisMapFromDisk, metropoleFromDisk } from "../../lib/disk";
import { pageMetadata } from "../../lib/site";

export const metadata = pageMetadata("grand-paris/");

export default function Metropole()
{
    return <GrandParis communes={metropoleFromDisk()} areas={grandParisMapFromDisk()} />;
}
