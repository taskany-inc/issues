import { TagCleanButton } from '@taskany/bricks/harmony';

import { AppliedFilter } from '../AppliedFilter/AppliedFilter';
import { GoalParentDropdown } from '../GoalParentDropdown/GoalParentDropdown';
import { trpc } from '../../utils/trpcClient';

interface AppliedGoalParentFilterProps {
    label?: string;
    value?: string[];
    readOnly?: boolean;
    onChange?: (values?: { id: string }[]) => void;
    onClose?: () => void;
    onClearFilter?: () => void;
}

export const AppliedGoalParentFilter = ({
    label,
    value = [],
    readOnly,
    onChange,
    onClose,
    onClearFilter,
}: AppliedGoalParentFilterProps) => {
    const { data: projects } = trpc.project.getByIds.useQuery({ ids: value });

    return (
        <AppliedFilter readOnly={readOnly} label={label} action={<TagCleanButton size="s" onClick={onClearFilter} />}>
            <GoalParentDropdown
                mode="multiple"
                value={projects}
                readOnly={readOnly}
                placement="bottom"
                onChange={onChange}
                onClose={onClose}
            />
        </AppliedFilter>
    );
};
