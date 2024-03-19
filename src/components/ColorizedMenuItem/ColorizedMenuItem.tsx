import { FC } from 'react';
import { MarkedListItem } from '@taskany/bricks';

import { StateDot } from '../StateDot/StateDot';
import { StateWrapper } from '../StateWrapper/StateWrapper';

import s from './ColorizedMenuItem.module.css';

export const ColorizedMenuItem: FC<{
    hue: number;
    children?: React.ReactNode;
    focused?: boolean;
    checked?: boolean;
    onClick?: () => void;
}> = ({ hue, children, ...props }) => {
    return (
        <StateWrapper hue={hue}>
            <MarkedListItem className={s.MarkedListItem} mark={<StateDot hue={hue} />} {...props}>
                {children}
            </MarkedListItem>
        </StateWrapper>
    );
};
