import { FC } from 'react';
import { debounce } from 'throttle-debounce';
import { FormControl } from '@taskany/bricks/harmony';

import { FilterAutoCompleteInput } from './FilterAutoCompleteInput/FilterAutoCompleteInput';

export const SearchFilter: FC<{
    defaultValue?: string;
    onChange: (search: string) => void;
}> = ({ defaultValue, onChange }) => {
    const debouncedSearchHandler = debounce(200, onChange);

    return (
        <FormControl>
            <FilterAutoCompleteInput defaultValue={defaultValue} onChange={debouncedSearchHandler} />
        </FormControl>
    );
};
