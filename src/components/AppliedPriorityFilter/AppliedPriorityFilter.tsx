import { useMemo } from 'react';
import { TagCleanButton } from '@taskany/bricks/harmony';

import { AppliedFilter } from '../AppliedFilter/AppliedFilter';
import { PriorityDropdown } from '../PriorityDropdown/PriorityDropdown';
import { trpc } from '../../utils/trpcClient';

interface AppliedPriorityFilterProps {
    label?: string;
    value?: string[];
    readOnly?: boolean;
    onChange?: (values?: { id: string }[]) => void;
    onClose?: () => void;
    onClearFilter?: () => void;
}

export const AppliedPriorityFilter = ({
    label,
    value,
    readOnly,
    onChange,
    onClose,
    onClearFilter,
}: AppliedPriorityFilterProps) => {
    const { data: priorities = [] } = trpc.priority.getAll.useQuery();

    const values = useMemo(() => {
        return priorities.filter((priority) => value?.includes(priority.id));
    }, [value, priorities]);

    return (
        <AppliedFilter readOnly={readOnly} label={label} action={<TagCleanButton size="s" onClick={onClearFilter} />}>
            <PriorityDropdown
                mode="multiple"
                value={values}
                readOnly={readOnly}
                onChange={onChange}
                onClose={onClose}
            />
        </AppliedFilter>
    );
};
