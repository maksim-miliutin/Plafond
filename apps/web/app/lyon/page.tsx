import { CityPage } from "../../components/CityPage";
import { shortName } from "../../components/LyonPage";
import { fromDisk, outlinesFromDisk, spansFromDisk } from "../../lib/disk";
import { pageMetadata } from "../../lib/site";

export const metadata = pageMetadata("lyon/");

export default function Lyon()
{
    const links = fromDisk().communes.map((commune) => ({ href: `${commune.slug}/`, label: shortName(commune.name) }));

    return <CityPage city="lyon" outlines={outlinesFromDisk().lyon} spans={spansFromDisk().lyon} links={links} />;
}
