import { noComplementFrom } from "@plafond/domain";

import { ComplementBars } from "./ComplementBars";

export function ComplementRules()
{
    return (
        <section className="findings">
            <h2>Ce qui exclut tout complément</h2>
            <ComplementBars signedOn={noComplementFrom} dpe="../../dpe/" />
        </section>
    );
}
