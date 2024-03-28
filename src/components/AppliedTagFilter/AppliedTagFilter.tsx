import { TagCleanButton } from '@taskany/bricks/harmony';

import { trpc } from '../../utils/trpcClient';
import { AppliedFilter } from '../AppliedFilter/AppliedFilter';
import { TagDropdown } from '../TagDropdown/TagDropdown';

interface AppliedTagsFilterProps {
    value?: string[];
    label?: string;
    readOnly?: boolean;
    onChange?: (values?: { id: string }[]) => void;
    onClose?: () => void;
    onClearFilter?: () => void;
}

export const AppliedTagFilter = ({
    value = [],
    label,
    readOnly,
    onChange,
    onClose,
    onClearFilter,
}: AppliedTagsFilterProps) => {
    const { data } = trpc.tag.getByIds.useQuery(value);

    return (
        <AppliedFilter readOnly={readOnly} label={label} action={<TagCleanButton size="s" onClick={onClearFilter} />}>
            <TagDropdown
                mode="multiple"
                value={data}
                readOnly={readOnly}
                placement="bottom"
                onChange={onChange}
                onClose={onClose}
            />
        </AppliedFilter>
    );
};
