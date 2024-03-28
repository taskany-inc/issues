import { useCallback, useMemo } from 'react';
import { TagCleanButton } from '@taskany/bricks/harmony';

import { AppliedFilter } from '../AppliedFilter/AppliedFilter';
import { PriorityDropdown } from '../PriorityDropdown/PriorityDropdown';
import { trpc } from '../../utils/trpcClient';

interface AppliedPriorityFilterProps {
    label?: string;
    value?: string[];
    readOnly?: boolean;
    onChange?: (values?: string[]) => void;
    onClose?: () => void;
}

export const AppliedPriorityFilter = ({ label, value, readOnly, onChange, onClose }: AppliedPriorityFilterProps) => {
    const { data: priorities = [] } = trpc.priority.getAll.useQuery();

    const values = useMemo(() => {
        return priorities.filter((priority) => value?.includes(priority.id));
    }, [value, priorities]);

    const handleChange = useCallback(
        (values: { id: string }[]) => {
            onChange?.(values.map(({ id }) => id));
        },
        [onChange],
    );

    const onClearFilter = useCallback(() => {
        onChange?.();
        onClose?.();
    }, [onChange, onClose]);

    return (
        <AppliedFilter readOnly={readOnly} label={label} action={<TagCleanButton size="s" onClick={onClearFilter} />}>
            <PriorityDropdown
                mode="multiple"
                value={values}
                readOnly={readOnly}
                onChange={handleChange}
                onClose={onClose}
            />
        </AppliedFilter>
    );
};
