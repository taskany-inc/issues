import { ComponentProps, FC, HTMLAttributes, ReactNode, useCallback } from 'react';
import cn from 'classnames';
import { nullable } from '@taskany/bricks';
import { Text, Switch, SwitchControl, Button } from '@taskany/bricks/harmony';
import { IconAddOutline, IconAdjustHorizontalSolid, IconAlignTopSolid, IconListUnorderedOutline } from '@taskany/icons';

import { PageView } from '../../hooks/useUrlFilterParams';
import { Dropdown, DropdownPanel, DropdownTrigger } from '../Dropdown/Dropdown';

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
                <span key="counter">{counter}</span>
                {`/${total}`}
            </>,
        )}
    </Text>
);

interface FiltersBarLayoutSwitchProps {
    value?: PageView;
    onChange?: (value: PageView) => void;
}

export const FiltersBarLayoutSwitch: FC<FiltersBarLayoutSwitchProps> = ({ value = 'list', onChange }) => {
    const onChangeCallback = useCallback(
        (_: React.SyntheticEvent<HTMLButtonElement>, active: string) => {
            onChange?.(active as PageView);
        },
        [onChange],
    );

    return (
        <Switch value={value} onChange={onChangeCallback}>
            <SwitchControl
                className={s.FiltersBarButton}
                iconLeft={<IconListUnorderedOutline size="s" />}
                value="list"
            />
            <SwitchControl className={s.FiltersBarButton} iconLeft={<IconAlignTopSolid size="s" />} value="kanban" />
        </Switch>
    );
};

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
    return (
        <Dropdown>
            <DropdownTrigger className={s.FiltersBarViewDropdownDrigger} view="fill">
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

interface AddFilterDropdownProps<T> {
    items: T[];
    onChange: (value: T) => void;
}
export const AddFilterDropdown = <T extends { id: string; title: string }>({
    items,
    onChange,
}: AddFilterDropdownProps<T>) => {
    return (
        <Dropdown>
            <DropdownTrigger
                renderTrigger={(props) =>
                    nullable(Boolean(items.length), () => (
                        <Button
                            text={tr('Filter')}
                            iconLeft={<IconAddOutline size="xxs" />}
                            onClick={props.onClick}
                            ref={props.ref}
                        />
                    ))
                }
            />
            <DropdownPanel
                placement="bottom"
                items={items}
                mode="single"
                onChange={onChange}
                renderItem={(props) => <Text size="s">{props.item.title}</Text>}
            />
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
