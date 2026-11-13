import { Home } from "../components/Home";
import { outlinesFromDisk } from "../lib/disk";
import { silhouette } from "../lib/map";
import { pageMetadata } from "../lib/site";

export const metadata = pageMetadata("");

export default function Start()
{
    const outlines = outlinesFromDisk();

    return <Home shapes={{ paris: silhouette(outlines.paris, 32), lyon: silhouette(outlines.lyon, 32) }} />;
}
