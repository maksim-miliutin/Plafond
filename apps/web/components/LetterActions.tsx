"use client";

import { useState } from "react";

import { letterText } from "@plafond/domain";
import type { Letter } from "@plafond/domain";

import { copy, type Copied } from "../lib/clipboard";

const said: Record<Copied | "waiting", string> = {
    waiting: "Copier le texte",
    copied: "Texte copié",
    refused: "Copie impossible, sélectionnez le texte à la main",
};

export function LetterActions({ letter }: { letter: Letter })
{
    const [state, setState] = useState<Copied | "waiting">("waiting");

    return (
        <div className="stack">
            <button type="button" className="primary" onClick={() => window.print()}>
                Imprimer ou enregistrer en PDF
            </button>
            <button type="button" className="secondary" onClick={async () => setState(await copy(letterText(letter), navigator.clipboard))}>
                {said[state]}
            </button>
            <p className="fine" role="status">{state === "waiting" ? "" : said[state]}</p>
        </div>
    );
}
