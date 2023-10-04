import { forwardRef } from 'react';
import { ComboBox } from '@taskany/bricks';

import { combobox } from '../utils/domObjects';

export const CommonCombobox = forwardRef<HTMLDivElement, React.ComponentProps<typeof ComboBox>>((props, ref) => {
    return (
        // TODO: https://github.com/taskany-inc/bricks/issues/506
        <span {...combobox.attr}>
            <ComboBox {...props} ref={ref} />
        </span>
    );
});
