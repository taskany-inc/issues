import { TagCleanButton } from '@taskany/bricks/harmony';
import { useCallback } from 'react';

import { trpc } from '../../utils/trpcClient';
import { AppliedFilter } from '../AppliedFilter/AppliedFilter';
import { TagDropdown } from '../TagDropdown/TagDropdown';

interface AppliedTagsFilterProps {
    value?: string[];
    label?: string;
    readOnly?: boolean;
    onChange?: (value?: string[]) => void;
    onClose?: () => void;
}

export const AppliedTagFilter = ({ value = [], label, readOnly, onChange, onClose }: AppliedTagsFilterProps) => {
    const { data } = trpc.tag.getByIds.useQuery(value);

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
            <TagDropdown
                mode="multiple"
                value={data}
                readOnly={readOnly}
                placement="bottom"
                onChange={handleChange}
                onClose={onClose}
            />
        </AppliedFilter>
    );
};
