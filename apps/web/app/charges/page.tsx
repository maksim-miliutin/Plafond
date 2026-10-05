import { Decompte } from "../../components/Decompte";
import { pageMetadata } from "../../lib/site";

export const metadata = pageMetadata("charges/");

export default function Charges()
{
    return <Decompte />;
}
