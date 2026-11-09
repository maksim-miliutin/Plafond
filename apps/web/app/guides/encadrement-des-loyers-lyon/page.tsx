import { Guide } from "../../../components/Guide";
import { guides } from "../../../lib/guides";
import { pageMetadata } from "../../../lib/site";

export const metadata = pageMetadata("guides/encadrement-des-loyers-lyon/");

export default function LyonGuide()
{
    return <Guide guide={guides.find((guide) => guide.slug === "encadrement-des-loyers-lyon")!} />;
}
