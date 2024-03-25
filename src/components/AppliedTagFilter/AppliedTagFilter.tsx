import { trpc } from '../../utils/trpcClient';
import { AppliedFilter } from '../AppliedFilter/AppliedFilter';
import { TagDropdown } from '../TagDropdown/TagDropdown';

interface AppliedTagsFilterProps {
    value?: string[];
    label?: string;
    readOnly?: boolean;
}

export const AppliedTagFilter = ({ value = [], label, readOnly }: AppliedTagsFilterProps) => {
    const { data } = trpc.tag.getByIds.useQuery(value);

    return (
        <AppliedFilter readOnly={readOnly} label={label}>
            <TagDropdown mode="multiple" value={data} readOnly={readOnly} placement="bottom" />
        </AppliedFilter>
    );
};
