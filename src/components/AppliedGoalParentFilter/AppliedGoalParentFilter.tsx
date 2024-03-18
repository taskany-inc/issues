import { AppliedFilter } from '../AppliedFilter/AppliedFilter';
import { GoalParentDropdown } from '../GoalParentDropdown/GoalParentDropdown';
import { trpc } from '../../utils/trpcClient';

interface AppliedGoalParentFilterProps {
    label?: string;
    value?: string[];
    readOnly?: boolean;
}

export const AppliedGoalParentFilter = ({ label, value = [], readOnly }: AppliedGoalParentFilterProps) => {
    const { data: projects } = trpc.project.getByIds.useQuery({ ids: value });

    return (
        <AppliedFilter readOnly={readOnly} label={label}>
            <GoalParentDropdown mode="multiple" value={projects} readOnly={readOnly} placement="bottom" />
        </AppliedFilter>
    );
};
