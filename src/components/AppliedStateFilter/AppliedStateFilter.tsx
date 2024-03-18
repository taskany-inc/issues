import { useMemo } from 'react';

import { AppliedFilter } from '../AppliedFilter/AppliedFilter';
import { StateDropdown } from '../StateDropdown/StateDropdown';
import { trpc } from '../../utils/trpcClient';

interface AppliedStateFilterProps {
    label?: string;
    value?: string[];
    stateTypes?: string[];
    readOnly?: boolean;
}

export const AppliedStateFilter = ({ label, value, stateTypes, readOnly }: AppliedStateFilterProps) => {
    const { data: states = [] } = trpc.state.all.useQuery();

    const values = useMemo(() => {
        if (stateTypes?.length) {
            return states.filter(({ type }) => stateTypes.includes(type));
        }

        return states.filter(({ id }) => value?.includes(id));
    }, [stateTypes, states, value]);

    return (
        <AppliedFilter readOnly={readOnly} label={label}>
            <StateDropdown mode="multiple" value={values} readOnly={readOnly} />
        </AppliedFilter>
    );
};
