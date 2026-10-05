import { Mentions } from "../../components/Mentions";
import { pageMetadata } from "../../lib/site";

export const metadata = pageMetadata("mentions/");

export default function Notice()
{
    return <Mentions />;
}
