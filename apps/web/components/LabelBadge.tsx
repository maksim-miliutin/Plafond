import type { Label } from "@plafond/domain";

export function LabelBadge({ label }: { label: Label })
{
    return <span className={`label label-${label}`} role="img" aria-label={`classe ${label}`}>{label}</span>;
}
