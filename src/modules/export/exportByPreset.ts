import { formateEstimate } from '@taskany/bricks';

import { getPriorityText } from '../../components/PriorityText/PriorityText';
import { TLocale } from '../../utils/getLang';

import { tr, I18nKey } from './export.i18n';

interface ExportGoalItem {
    id: string;
    title: string;
    project: string;
    estimate: Date | null;
    estimateType: 'Year' | 'Quarter' | 'Strict' | null;
    priority: 'High' | 'Highest' | 'Medium' | 'Low';
    state: string;
}

const columns: I18nKey[] = ['Title', 'Project', 'Status', 'Priority', 'Estimate'];

const escapeCommaCharaters = (title: string) => {
    // eslint-disable-next-line prettier/prettier, no-useless-escape
    return `"${title.replace(',', ',')}"`;
};

export const exportByPreset = <T extends ExportGoalItem>(data: T[], locale: TLocale): string => {
    const translatedColumns = columns.map((col) => tr(col));

    const preparedData = data.map((val) => {
        const { title, project, state, priority, estimate, estimateType } = val;

        const estimateValue = estimate
            ? formateEstimate(estimate, {
                  type: estimateType != null ? estimateType : undefined,
                  locale,
              })
            : null;

        return [escapeCommaCharaters(title), project, state, getPriorityText(priority), estimateValue].join(',');
    });

    return [translatedColumns].concat(preparedData).join('\n');
};
