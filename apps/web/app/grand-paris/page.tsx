import { GrandParis } from "../../components/GrandParis";
import { grandParisMapFromDisk, metropoleFromDisk, regionFromDisk } from "../../lib/disk";
import { pageMetadata } from "../../lib/site";

export const metadata = pageMetadata("grand-paris/");

export default function Metropole()
{
    return <GrandParis communes={metropoleFromDisk()} areas={grandParisMapFromDisk()} tense={Object.fromEntries(regionFromDisk().filter((row) => row.grandParis).map((row) => [row.code, row.tensePart === 1]))} />;
}
