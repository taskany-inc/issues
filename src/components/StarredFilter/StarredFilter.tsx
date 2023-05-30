import { useCallback } from 'react';
import { FiltersMenuItem } from '@taskany/bricks';

import { tr } from './StarredFilter.i18n';

interface StarredFilterProps {
    value?: boolean;

    onChange?: (value: boolean) => void;
}

export const StarredFilter: React.FC<StarredFilterProps> = ({ value, onChange }) => {
    const onChangeHandler = useCallback(() => {
        onChange?.(!value);
    }, [value, onChange]);

    return (
        <FiltersMenuItem active={value} onClick={onChangeHandler}>
            {tr('Starred')}
        </FiltersMenuItem>
    );
};
