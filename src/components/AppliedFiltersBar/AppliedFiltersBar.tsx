import React, { ReactNode, useMemo } from 'react';
import { Button, Text } from '@taskany/bricks/harmony';
import { IconBinOutline, IconSaveOutline, IconMoreHorizontalOutline } from '@taskany/icons';

import { Dropdown, DropdownPanel, DropdownTrigger } from '../Dropdown/Dropdown';
import { FilterById } from '../../../trpc/inferredTypes';

import s from './AppliedFiltersBar.module.css';
import { tr } from './AppliedFiltersBar.i18n';

interface AppliedFiltersBarProps {
    filterPreset?: FilterById;
    queryString?: string;
    children?: ReactNode;
    onSavePreset?: () => void;
    onDeletePreset?: () => void;
}

export const AppliedFiltersBar = ({
    filterPreset,
    queryString,
    children,
    onSavePreset,
    onDeletePreset,
    ...props
}: AppliedFiltersBarProps) => {
    const presetOptions = useMemo(() => {
        return [{ id: 'Delete preset', title: tr('Delete preset'), onClick: onDeletePreset }];
    }, [onDeletePreset]);

    return (
        <div className={s.AppliedFiltersBar} {...props}>
            <div className={s.AppliedFilters}>{children}</div>
            <div className={s.AppliedFiltersActions}>
                {((Boolean(queryString) && !filterPreset) ||
                    (filterPreset && !filterPreset._isOwner && !filterPreset._isStarred)) &&
                    !filterPreset?.default && (
                        <Button text={tr('Save')} iconLeft={<IconSaveOutline size="s" />} onClick={onSavePreset} />
                    )}

                {filterPreset && (filterPreset._isOwner || filterPreset._isStarred) && (
                    <Dropdown>
                        <DropdownTrigger
                            renderTrigger={(props) => (
                                <Button
                                    iconLeft={<IconMoreHorizontalOutline size="s" />}
                                    ref={props.ref}
                                    onClick={props.onClick}
                                />
                            )}
                        />
                        <DropdownPanel
                            placement="bottom"
                            items={presetOptions}
                            selectable
                            iconLeft={<IconBinOutline size="s" className={s.AppliedFiltersTrash} />}
                            renderItem={(props) => (
                                <Text size="s" className={s.AppliedFiltersTrash} onClick={props.item.onClick}>
                                    {props.item.title}
                                </Text>
                            )}
                        />
                    </Dropdown>
                )}
            </div>
        </div>
    );
};
