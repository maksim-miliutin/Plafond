export interface ProgressProps
{
    at: number;
    of: number;
    label: string;
}

export function Progress({ at, of, label }: ProgressProps)
{
    return (
        <div className="progress">
            <span className="segments" aria-hidden="true">
                {Array.from({ length: of }, (_, index) => (
                    <span key={index} className={index < at ? "segment done" : "segment"} />
                ))}
            </span>
            <p>Étape {at} sur {of}&nbsp;: {label}</p>
        </div>
    );
}
