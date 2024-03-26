import { IconPlusCircleOutline } from '@taskany/icons';
import { ComponentProps, forwardRef } from 'react';
import cn from 'classnames';

import { InlineTrigger } from '../InlineTrigger/InlineTrigger';

import s from './AddInlineTrigger.module.css';

type InlineTriggerProps = ComponentProps<typeof InlineTrigger>;

interface AddInlineTriggerProps {
    text: string;
    onClick: InlineTriggerProps['onClick'];
    icon?: React.ReactNode;
    centered?: boolean;
}

export const AddInlineTrigger = forwardRef<HTMLDivElement, AddInlineTriggerProps>(
    ({ icon = <IconPlusCircleOutline size="xs" />, text, onClick, centered = true, ...attrs }, ref) => (
        <InlineTrigger
            ref={ref}
            icon={icon}
            text={text}
            onClick={onClick}
            className={cn(s.InlineTrigger, { [s.InlineTrigger_centered]: centered })}
            {...attrs}
        />
    ),
);
