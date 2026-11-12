import type { Day } from "./day.js";

export interface LawPeriod
{
    from: Day;
    until: Day;  // the first day the law no longer covers
    title: string;
    url: string;
}
