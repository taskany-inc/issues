import { ComponentProps, FC, HTMLAttributes, ReactNode, useState } from 'react';
import cn from 'classnames';
import { nullable } from '@taskany/bricks';
import { Text, Switch, SwitchControl, Dropdown, DropdownPanel, DropdownTrigger } from '@taskany/bricks/harmony';
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

export const FiltersBarViewDropdown: FC<{ children?: ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dropdown isOpen={isOpen} onClose={() => setIsOpen(false)}>
            <DropdownTrigger className={s.FiltersBarViewDropdownDrigger} view="fill" onClick={() => setIsOpen(true)}>
                <div className={s.FiltersBarViewDropdownDrigger}>
                    <IconAdjustHorizontalSolid size="xxs" />
                    <Text size="s">{tr('View')}</Text>
                </div>
            </DropdownTrigger>
            <DropdownPanel width={335} placement="bottom-start" className={s.FiltersBarDropdownPanel}>
                <div className={s.FiltersBarDropdownPanelContainer}>{children}</div>
            </DropdownPanel>
        </Dropdown>
    );
};

export const FiltersBarDropdownTitle: FC<ComponentProps<typeof Text>> = ({ children }) => {
    return (
        <Text className={s.FiltersBarDropdownTitle} weight="bold">
            {children}
        </Text>
    );
};

export const FiltersBarDropdownContent: FC<HTMLAttributes<HTMLDivElement>> = ({ children }) => {
    return <div className={s.FiltersBarDropdownContent}>{children}</div>;
};
