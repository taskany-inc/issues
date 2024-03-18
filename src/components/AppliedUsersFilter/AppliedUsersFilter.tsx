import { AppliedFilter } from '../AppliedFilter/AppliedFilter';
import { UserDropdown } from '../UserDropdown/UserDropdown';
import { trpc } from '../../utils/trpcClient';

interface AppliedUsersFilterProps {
    label?: string;
    value?: string[];
    readOnly?: boolean;
}

export const AppliedUsersFilter = ({ label, value: ids, readOnly }: AppliedUsersFilterProps) => {
    const { data = [] } = trpc.user.getFilterUsersByIds.useQuery(ids);

    return (
        <AppliedFilter readOnly={readOnly} label={label}>
            <UserDropdown mode="multiple" value={data} readOnly={readOnly} />
        </AppliedFilter>
    );
};
