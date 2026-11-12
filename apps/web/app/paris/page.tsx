import { ordinal } from "@plafond/domain";

import { CityPage } from "../../components/CityPage";
import { fromDisk, outlinesFromDisk, spansFromDisk } from "../../lib/disk";
import { pageMetadata } from "../../lib/site";

export const metadata = pageMetadata("paris/");

export default function Paris()
{
    const links = fromDisk().districts.map((district) => ({ href: `../arrondissements/${district.slug}/`, label: `${ordinal(district.number)} arrondissement` }));

    return <CityPage city="paris" outlines={outlinesFromDisk().paris} span={spansFromDisk().paris} links={links} />;
}
