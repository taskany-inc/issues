import { notifyPromise } from '../utils/notifyPromise';
import { CreateFilter } from '../schema/filter';
import { ToggleSubscription } from '../schema/common';
import { trpc } from '../utils/trpcClient';
import { downloadAsFile } from '../utils/downloadAsFile';
import { localeDateFormat } from '../utils/dateTime';
import { exportByPreset } from '../modules/export/exportByPreset';

import { useLocale } from './useLocale';

export const useFilterResource = () => {
    const locale = useLocale();
    const createMutation = trpc.filter.create.useMutation();
    const deleteMutation = trpc.filter.delete.useMutation();
    const toggleMutation = trpc.filter.toggleStargizer.useMutation();
    const exportCsvMutation = trpc.v2.goal.exportCsv.useMutation();
    const utils = trpc.useContext();

    const createFilter = (data: CreateFilter) =>
        notifyPromise(
            createMutation.mutateAsync(data, {
                onSuccess: () => {
                    utils.filter.getUserFilters.invalidate();
                },
            }),
            'filterCreate',
        );

    const toggleFilterStar = (data: ToggleSubscription) =>
        notifyPromise(
            toggleMutation.mutateAsync(data, {
                onSuccess: () => {
                    utils.filter.getUserFilters.invalidate();
                    utils.filter.getById.invalidate();
                },
            }),
            data.direction ? 'filterStar' : 'filterUnstar',
        );

    const deleteFilter = (id: string) =>
        notifyPromise(
            deleteMutation.mutateAsync(id, {
                onSuccess: () => {
                    utils.filter.getUserFilters.invalidate();
                },
            }),
            'filterDelete',
        );

    const exportCsv = async (id: string) => {
        notifyPromise(
            exportCsvMutation.mutateAsync(
                { filterPresetId: id },
                {
                    onSuccess: (data) => {
                        const { currentPreset, dataForExport } = data;
                        const fileName = `${currentPreset.title} - ${localeDateFormat(new Date(), locale)}.csv`;

                        downloadAsFile(exportByPreset(dataForExport, locale), fileName, 'text/csv');
                    },
                },
            ),
            'exportCsv',
        );
    };

    return {
        createFilter,
        toggleFilterStar,
        deleteFilter,
        exportCsv,
    };
};
