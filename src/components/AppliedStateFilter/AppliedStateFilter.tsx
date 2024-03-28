import { useCallback, useMemo } from 'react';
import { TagCleanButton } from '@taskany/bricks/harmony';

import { AppliedFilter } from '../AppliedFilter/AppliedFilter';
import { StateDropdown } from '../StateDropdown/StateDropdown';
import { trpc } from '../../utils/trpcClient';

interface AppliedStateFilterProps {
    label?: string;
    value?: string[];
    stateTypes?: string[];
    readOnly?: boolean;
    onChange?: (values?: string[]) => void;
    onClose?: () => void;
}

export const AppliedStateFilter = ({
    label,
    value,
    stateTypes,
    readOnly,
    onChange,
    onClose,
}: AppliedStateFilterProps) => {
    const { data: states = [] } = trpc.state.all.useQuery();

    const values = useMemo(() => {
        if (stateTypes?.length) {
            return states.filter(({ type }) => stateTypes.includes(type));
        }

        return states.filter(({ id }) => value?.includes(id));
    }, [stateTypes, states, value]);

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
            <StateDropdown
                mode="multiple"
                value={values}
                readOnly={readOnly}
                onChange={handleChange}
                onClose={onClose}
            />
        </AppliedFilter>
    );
};
