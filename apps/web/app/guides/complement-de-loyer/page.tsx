import { Guide } from "../../../components/Guide";
import { guides } from "../../../lib/guides";
import { pageMetadata } from "../../../lib/site";

export const metadata = pageMetadata("guides/complement-de-loyer/");

export default function SupplementGuide()
{
    return <Guide guide={guides.find((guide) => guide.slug === "complement-de-loyer")!} />;
}
