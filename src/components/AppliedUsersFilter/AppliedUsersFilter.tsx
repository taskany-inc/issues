import { useCallback } from 'react';
import { TagCleanButton } from '@taskany/bricks/harmony';

import { AppliedFilter } from '../AppliedFilter/AppliedFilter';
import { UserDropdown } from '../UserDropdown/UserDropdown';
import { trpc } from '../../utils/trpcClient';

interface AppliedUsersFilterProps {
    label?: string;
    value?: string[];
    readOnly?: boolean;
    onChange?: (values?: string[]) => void;
    onClose?: () => void;
}

export const AppliedUsersFilter = ({ label, value: ids, readOnly, onChange, onClose }: AppliedUsersFilterProps) => {
    const { data = [] } = trpc.user.getFilterUsersByIds.useQuery(ids);

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
            <UserDropdown
                mode="multiple"
                placement="bottom"
                value={data}
                readOnly={readOnly}
                onChange={handleChange}
                onClose={onClose}
            />
        </AppliedFilter>
    );
};
