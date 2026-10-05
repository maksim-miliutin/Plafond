import { Guide } from "../../../components/Guide";
import { guides } from "../../../lib/guides";
import { pageMetadata } from "../../../lib/site";

export const metadata = pageMetadata("guides/revision-du-loyer/");

export default function RevisionGuide()
{
    return <Guide guide={guides.find((guide) => guide.slug === "revision-du-loyer")!} />;
}
