import { FC, useCallback } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@common/Button';
import Dropdown from '@common/Dropdown';
import { Icon } from '@common/Icon';
import { MenuItem } from '@common/MenuItem';

import { ModalEvent, dispatchModalEvent } from '../utils/dispatchModal';

export const PageHeaderActionButton: FC = () => {
    const t = useTranslations('Header');

    const onMenuItemClick = useCallback(({ event }: { event: ModalEvent }) => {
        dispatchModalEvent(event)();
    }, []);

    return (
        <>
            <Button
                text={t('Create')}
                view="primary"
                outline
                brick="right"
                onClick={dispatchModalEvent(ModalEvent.GoalCreateModal)}
            />
            <Dropdown
                onChange={onMenuItemClick}
                items={[
                    {
                        title: t('Create goal'),
                        event: ModalEvent.GoalCreateModal,
                    },
                    {
                        title: t('Create project'),
                        event: ModalEvent.ProjectCreateModal,
                    },
                    {
                        title: t('Create team'),
                        event: ModalEvent.TeamCreateModal,
                    },
                ]}
                renderTrigger={(props) => (
                    <Button
                        view="primary"
                        outline
                        brick="left"
                        iconRight={<Icon size="s" noWrap type={props.visible ? 'arrowUpSmall' : 'arrowDownSmall'} />}
                        ref={props.ref}
                        onClick={props.onClick}
                    />
                )}
                renderItem={(props) => (
                    <MenuItem
                        key={props.item.title}
                        focused={props.cursor === props.index}
                        onClick={props.onClick}
                        view="primary"
                        ghost
                    >
                        {props.item.title}
                    </MenuItem>
                )}
            />
        </>
    );
};
