// The one rounding rule for money: to the nearest cent, a half cent going up.
export function rounded(numerator: number, denominator: number): number
{
    return Math.floor((2 * numerator + denominator) / (2 * denominator));
}
