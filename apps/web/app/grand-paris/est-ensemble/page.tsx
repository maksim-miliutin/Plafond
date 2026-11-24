import { TerritoryPage } from "../../../components/TerritoryPage";
import { territoryFromDisk } from "../../../lib/disk";
import { simulators } from "../../../lib/metropole";
import { pageMetadata } from "../../../lib/site";
import { territoryCopy } from "../../../lib/territory-copy";

export const metadata = pageMetadata("grand-paris/est-ensemble/");

export default function EstEnsemble()
{
    const copy = territoryCopy["est-ensemble"];
    const { communes, spans, example } = territoryFromDisk("est-ensemble");

    return <TerritoryPage copy={copy} communes={communes} spans={spans} example={example} simulator={simulators["est-ensemble"]} />;
}
