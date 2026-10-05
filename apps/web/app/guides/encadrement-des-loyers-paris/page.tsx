import { DistrictLinks } from "../../../components/DistrictLinks";
import { Guide } from "../../../components/Guide";
import { fromDisk } from "../../../lib/disk";
import { guides } from "../../../lib/guides";
import { pageMetadata } from "../../../lib/site";

export const metadata = pageMetadata("guides/encadrement-des-loyers-paris/");

export default function RentGuide()
{
    return (
        <Guide
            guide={guides.find((guide) => guide.slug === "encadrement-des-loyers-paris")!}
            more={<DistrictLinks districts={fromDisk().districts} />}
        />
    );
}
