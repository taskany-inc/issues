import { HistoryRecordMeta, HistoryRecordSubject, subjectToTableNameMap } from '../types/history';

export const subjectToEnumValue = (subject: string): subject is keyof HistoryRecordSubject => {
    return subject in subjectToTableNameMap;
};

export const castToMetaDto = (
    subject: keyof HistoryRecordSubject,
    meta: unknown,
): meta is HistoryRecordMeta[typeof subject] => {
    return meta != null;
};
