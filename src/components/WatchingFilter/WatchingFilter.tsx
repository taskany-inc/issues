import { useCallback } from 'react';
import { FiltersMenuItem } from '@taskany/bricks';

import { tr } from './WatchingFilter.i18n';

interface WatchingFilterProps {
    value?: boolean;

    onChange?: (value: boolean) => void;
}

export const WatchingFilter: React.FC<WatchingFilterProps> = ({ value, onChange }) => {
    const onChangeHandler = useCallback(() => {
        onChange?.(!value);
    }, [value, onChange]);

    return (
        <FiltersMenuItem active={value} onClick={onChangeHandler}>
            {tr('Watching')}
        </FiltersMenuItem>
    );
};
