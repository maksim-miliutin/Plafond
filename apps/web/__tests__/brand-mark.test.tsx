import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { AddressStep } from "../components/AddressStep";
import { Brand } from "../components/Brand";
import { ChargesFormStep } from "../components/ChargesFormStep";
import { DepositFormStep } from "../components/DepositFormStep";
import { DpeFindStep } from "../components/DpeFindStep";
import { Home } from "../components/Home";
import { chargesStart } from "../lib/charges-flow";
import { depositQuestions, type DepositFields } from "../lib/deposit-flow";

test("the brand is the app's own icon beside the name, and only the name is read out", () =>
{
    const mark = renderToStaticMarkup(<Brand />);

    expect(mark).toMatch(/<img[^>]*src="\/icon-192\.png"[^>]*alt=""|<img[^>]*alt=""[^>]*src="\/icon-192\.png"/);
    expect(mark).toContain("<span>Plafond</span>");
});

test("the first screen of the app and of each check carries the brand", () =>
{
    const blankDeposit = Object.fromEntries(Object.keys(depositQuestions).map((key) => [key, ""])) as unknown as DepositFields;
    const screens = [
        <Home key="home" />,
        <AddressStep key="rent" />,
        <DpeFindStep key="dpe" />,
        <DepositFormStep key="deposit" fields={blankDeposit} errors={{}} />,
        <ChargesFormStep key="charges" fields={chargesStart.at === "form" ? chargesStart.fields : {}} errors={{}} />,
    ];

    for (const screen of screens)
    {
        expect(renderToStaticMarkup(screen), screen.key ?? "").toContain('class="brand"');
    }
});
