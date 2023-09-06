export { DateType } from '@prisma/client';

export type DateRange = { start?: Date | null; end: Date };

export enum Quarters {
    Q1 = 'Q1',
    Q2 = 'Q2',
    Q3 = 'Q3',
    Q4 = 'Q4',
}

export type QuartersKeys = keyof typeof Quarters;
