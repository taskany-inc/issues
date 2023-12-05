import { FC, useCallback } from 'react';
import { Button, Dropdown, MenuItem } from '@taskany/bricks';
import { IconUpSmallSolid, IconDownSmallSolid } from '@taskany/icons';

import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import {
    createFastButton,
    createGoalItem,
    createProjectItem,
    createSelectButton,
    createPersonalGoalItem,
} from '../../utils/domObjects';

import { tr } from './PageHeaderActionButton.i18n';

export const PageHeaderActionButton: FC = () => {
    const onMenuItemClick = useCallback(({ event, params }: { event: ModalEvent; params: unknown }) => {
        dispatchModalEvent(event, params)();
    }, []);

    return (
        <>
            <Button
                text={tr('Create')}
                view="primary"
                outline
                brick="right"
                onClick={dispatchModalEvent(ModalEvent.GoalCreateModal)}
                {...createFastButton.attr}
            />
            <Dropdown
                onChange={onMenuItemClick}
                items={[
                    {
                        title: tr('Create goal'),
                        event: ModalEvent.GoalCreateModal,
                        params: {},
                        attrs: createGoalItem.attr,
                    },
                    {
                        title: tr('Create personal goal'),
                        event: ModalEvent.GoalCreateModal,
                        params: {
                            personal: true,
                        },
                        attrs: createPersonalGoalItem.attr,
                    },
                    {
                        title: tr('Create project'),
                        event: ModalEvent.ProjectCreateModal,
                        params: {},
                        attrs: createProjectItem.attr,
                    },
                ]}
                renderTrigger={(props) => (
                    <Button
                        view="primary"
                        outline
                        brick="left"
                        iconRight={props.visible ? <IconUpSmallSolid size="s" /> : <IconDownSmallSolid size="s" />}
                        ref={props.ref}
                        onClick={props.onClick}
                        {...createSelectButton.attr}
                    />
                )}
                renderItem={(props) => (
                    <MenuItem
                        key={props.item.title}
                        focused={props.cursor === props.index}
                        onClick={props.onClick}
                        view="primary"
                        ghost
                        {...props.item.attrs}
                    >
                        {props.item.title}
                    </MenuItem>
                )}
            />
        </>
    );
};
