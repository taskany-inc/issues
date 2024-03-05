import { FC, HTMLAttributes } from 'react';
import cn from 'classnames';
import { nullable } from '@taskany/bricks';
import { Text, Button, Switch, SwitchControl } from '@taskany/bricks/harmony';
import { IconAdjustHorizontalSolid, IconAlignTopSolid, IconListUnorderedOutline } from '@taskany/icons';

import s from './FiltersBar.module.css';
import { tr } from './FiltersBar.i18n';

interface FilterBarCounterProps {
    counter?: number;
    total?: number;
}

export const FilterBarCounter: FC<FilterBarCounterProps> = ({ counter, total }) => (
    <Text className={s.FiltersBarCounter} size="s">
        {nullable(
            counter === undefined || total === counter,
            () => total,
            <>
                <span key="counter" className={s.FiltersBarCounterActive}>
                    {counter}
                </span>
                {`/${total}`}
            </>,
        )}
    </Text>
);

export const layoutType = {
    kanban: 'kanban',
    table: 'table',
} as const;

export type LayoutType = keyof typeof layoutType;

interface FiltersBarLayoutSwitchProps {
    value: LayoutType;
}

export const FiltersBarLayoutSwitch: FC<FiltersBarLayoutSwitchProps> = ({ value }) => (
    <Switch value={value}>
        <SwitchControl
            disabled
            className={s.FiltersBarButton}
            iconLeft={<IconListUnorderedOutline size="s" />}
            value={layoutType.table}
        />
        <SwitchControl
            disabled
            className={s.FiltersBarButton}
            iconLeft={<IconAlignTopSolid size="s" />}
            value={layoutType.kanban}
        />
    </Switch>
);

export const FiltersBar: FC<HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
    <div className={cn(s.FiltersBar, className)} {...props}>
        {children}
    </div>
);

export const FiltersBarTitle: FC<HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
    <Text className={cn(s.FiltersBarTitle, className)} {...props}>
        {children}
    </Text>
);

interface FilterBarItem extends HTMLAttributes<HTMLDivElement> {
    layout?: 'default' | 'fill';
}

export const FiltersBarItem: FC<FilterBarItem> = ({ children, className, layout = 'default', ...props }) => (
    <div className={cn(s.FiltersBarItem, { [s.FiltersBarItemCenter]: layout === 'fill' }, className)} {...props}>
        {children}
    </div>
);

export const FiltersBarControlGroup: FC<HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
    <div className={cn(s.FiltersBarControlGroup, className)} {...props}>
        {children}
    </div>
);

export const FiltersBarViewDropdown: FC = () => (
    <Button
        disabled
        text={tr('View')}
        className={s.FiltersBarButton}
        iconLeft={<IconAdjustHorizontalSolid size="xxs" />}
    />
);
