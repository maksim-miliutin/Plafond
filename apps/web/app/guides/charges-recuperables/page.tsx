import { Guide } from "../../../components/Guide";
import { guides } from "../../../lib/guides";
import { pageMetadata } from "../../../lib/site";

export const metadata = pageMetadata("guides/charges-recuperables/");

export default function ChargesGuide()
{
    return <Guide guide={guides.find((guide) => guide.slug === "charges-recuperables")!} />;
}
