import { quarters } from '../utils/dateTime';

export type Estimate = { date: string | null; q: QuartersKeys | null; y: string };
export type QuartersKeys = keyof typeof quarters;
export type Option = { title: string; clue: string | null };
