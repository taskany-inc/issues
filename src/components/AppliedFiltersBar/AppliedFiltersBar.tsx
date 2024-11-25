import React, { ReactNode, useMemo } from 'react';
import { Badge, Button } from '@taskany/bricks/harmony';
import { IconBinOutline, IconSaveOutline, IconMoreHorizontalOutline, IconDownloadOutline } from '@taskany/icons';
import classNames from 'classnames';

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
    onExport?: () => void;
}

interface PresetOption {
    id: string;
    title: string;
    onClick?: () => void;
    icon: React.ReactNode;
    className: string | undefined;
}

export const AppliedFiltersBar = ({
    filterPreset,
    queryString,
    children,
    onSavePreset,
    onDeletePreset,
    onExport,
    ...props
}: AppliedFiltersBarProps) => {
    const presetOptions = useMemo<PresetOption[]>(() => {
        const base: PresetOption[] = [
            {
                id: 'Delete preset',
                title: tr('Delete preset'),
                onClick: onDeletePreset,
                icon: <IconBinOutline size="s" className={s.AppliedFiltersTrash} />,
                className: s.AppliedFiltersTrash,
            },
        ];
        if (onExport != null) {
            base.push({
                id: 'Export goals',
                title: tr('Export csv'),
                onClick: onExport,
                icon: <IconDownloadOutline size="s" />,
                className: undefined,
            });
        }

        return base;
    }, [onDeletePreset, onExport]);

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
                            renderItem={(props) => (
                                <Badge
                                    weight="regular"
                                    text={props.item.title}
                                    iconLeft={props.item.icon}
                                    className={classNames(s.AppliedFiltersBarBadge, props.item.className)}
                                    onClick={props.item.onClick}
                                />
                            )}
                        />
                    </Dropdown>
                )}
            </div>
        </div>
    );
};
