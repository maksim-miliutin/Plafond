import { Guide } from "../../../components/Guide";
import { guides } from "../../../lib/guides";
import { pageMetadata } from "../../../lib/site";

export const metadata = pageMetadata("guides/depot-de-garantie/");

export default function DepositGuide()
{
    return <Guide guide={guides.find((guide) => guide.slug === "depot-de-garantie")!} />;
}
