import { subjectToTableNameMap } from '../types/history';
import type { Subject, Meta } from '../types/history';

export const subjectToEnumValue = (subject: string): subject is keyof Subject => {
    return subject in subjectToTableNameMap;
};

export const castToMetaDto = (subject: keyof Subject, meta: unknown): meta is Meta[typeof subject] => {
    return meta != null;
};
