import { TerritoryPage } from "../../../components/TerritoryPage";
import { territoryFromDisk } from "../../../lib/disk";
import { simulators } from "../../../lib/metropole";
import { pageMetadata } from "../../../lib/site";
import { territoryCopy } from "../../../lib/territory-copy";

export const metadata = pageMetadata("grand-paris/plaine-commune/");

export default function PlaineCommune()
{
    const copy = territoryCopy["plaine-commune"];
    const { communes, spans, example } = territoryFromDisk("plaine-commune");

    return <TerritoryPage copy={copy} communes={communes} spans={spans} example={example} simulator={simulators["plaine-commune"]} />;
}
