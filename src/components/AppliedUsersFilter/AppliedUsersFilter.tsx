import { TagCleanButton, AppliedFilter } from '@taskany/bricks/harmony';

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
                filter={data.map(({ user }) => user.email)}
                readOnly={readOnly}
                onChange={onChange}
                onClose={onClose}
            />
        </AppliedFilter>
    );
};
