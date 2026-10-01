import type { ComponentProps } from "react";

// A form whose method is dialog and which sits outside a dialog element submits nowhere, even before the script loads.
export function LocalForm(props: Omit<ComponentProps<"form">, "method" | "action">)
{
    return <form {...props} method="dialog" />;
}
