import { GrandParis } from "../../components/GrandParis";
import { grandParisMapFromDisk, grandParisZonesFromDisk, metropoleFromDisk } from "../../lib/disk";
import { pageMetadata } from "../../lib/site";

export const metadata = pageMetadata("grand-paris/");

export default function Metropole()
{
    return <GrandParis communes={metropoleFromDisk()} areas={grandParisMapFromDisk()} zones={Object.fromEntries(grandParisZonesFromDisk().map((row) => [row.code, row.zone]))} />;
}
