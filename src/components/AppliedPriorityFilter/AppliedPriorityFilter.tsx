import { useMemo } from 'react';

import { AppliedFilter } from '../AppliedFilter/AppliedFilter';
import { PriorityDropdown } from '../PriorityDropdown/PriorityDropdown';
import { trpc } from '../../utils/trpcClient';

interface AppliedPriorityFilterProps {
    label?: string;
    value?: string[];
    readOnly?: boolean;
}

export const AppliedPriorityFilter = ({ label, value, readOnly }: AppliedPriorityFilterProps) => {
    const { data: priorities = [] } = trpc.priority.getAll.useQuery();

    const values = useMemo(() => {
        return priorities.filter((priority) => value?.includes(priority.id));
    }, [value, priorities]);

    return (
        <AppliedFilter readOnly={readOnly} label={label}>
            <PriorityDropdown mode="multiple" value={values} readOnly={readOnly} />
        </AppliedFilter>
    );
};
