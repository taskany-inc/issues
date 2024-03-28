import { useCallback } from 'react';
import { TagCleanButton } from '@taskany/bricks/harmony';

import { AppliedFilter } from '../AppliedFilter/AppliedFilter';
import { GoalParentDropdown } from '../GoalParentDropdown/GoalParentDropdown';
import { trpc } from '../../utils/trpcClient';

interface AppliedGoalParentFilterProps {
    label?: string;
    value?: string[];
    readOnly?: boolean;
    onChange?: (value?: string[]) => void;
    onClose?: () => void;
}

export const AppliedGoalParentFilter = ({
    label,
    value = [],
    readOnly,
    onChange,
    onClose,
}: AppliedGoalParentFilterProps) => {
    const { data: projects } = trpc.project.getByIds.useQuery({ ids: value });

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
            <GoalParentDropdown
                mode="multiple"
                value={projects}
                readOnly={readOnly}
                placement="bottom"
                onChange={handleChange}
                onClose={onClose}
            />
        </AppliedFilter>
    );
};
