import { Guide } from "../../../components/Guide";
import { guides } from "../../../lib/guides";
import { pageMetadata } from "../../../lib/site";

export const metadata = pageMetadata("guides/preavis-de-depart/");

export default function NoticeGuide()
{
    return <Guide guide={guides.find((guide) => guide.slug === "preavis-de-depart")!} />;
}
