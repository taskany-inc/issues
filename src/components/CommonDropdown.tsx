import { forwardRef } from 'react';
import { Dropdown } from '@taskany/bricks';

import { combobox } from '../utils/domObjects';

export const CommonDropdown = forwardRef<HTMLDivElement, React.ComponentProps<typeof Dropdown>>((props, ref) => {
    return (
        // TODO: https://github.com/taskany-inc/bricks/issues/506
        <span {...combobox.attr}>
            <Dropdown {...props} ref={ref} />
        </span>
    );
});
