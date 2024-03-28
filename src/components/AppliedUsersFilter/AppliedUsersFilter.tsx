import { TagCleanButton } from '@taskany/bricks/harmony';

import { AppliedFilter } from '../AppliedFilter/AppliedFilter';
import { UserDropdown } from '../UserDropdown/UserDropdown';
import { trpc } from '../../utils/trpcClient';

interface AppliedUsersFilterProps {
    label?: string;
    value?: string[];
    readOnly?: boolean;
    onChange?: (values?: { id: string }[]) => void;
    onClose?: () => void;
    onClearFilter?: () => void;
}

export const AppliedUsersFilter = ({
    label,
    value: ids,
    readOnly,
    onChange,
    onClose,
    onClearFilter,
}: AppliedUsersFilterProps) => {
    const { data = [] } = trpc.user.getFilterUsersByIds.useQuery(ids);

    return (
        <AppliedFilter readOnly={readOnly} label={label} action={<TagCleanButton size="s" onClick={onClearFilter} />}>
            <UserDropdown
                mode="multiple"
                placement="bottom"
                value={data}
                readOnly={readOnly}
                onChange={onChange}
                onClose={onClose}
            />
        </AppliedFilter>
    );
};
