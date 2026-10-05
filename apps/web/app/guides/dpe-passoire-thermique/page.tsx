import { Guide } from "../../../components/Guide";
import { guides } from "../../../lib/guides";
import { pageMetadata } from "../../../lib/site";

export const metadata = pageMetadata("guides/dpe-passoire-thermique/");

export default function EnergyGuide()
{
    return <Guide guide={guides.find((guide) => guide.slug === "dpe-passoire-thermique")!} />;
}
