import { FC, useCallback } from 'react';
import { Button, Dropdown, MenuItem } from '@taskany/bricks';
import { IconUpSmallSolid, IconDownSmallSolid } from '@taskany/icons';

import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import { createFastButton, createGoalItem, createProjectItem, createSelectButton } from '../../utils/domObjects';

import { tr } from './PageHeaderActionButton.i18n';

export const PageHeaderActionButton: FC = () => {
    const onMenuItemClick = useCallback(({ event }: { event: ModalEvent }) => {
        dispatchModalEvent(event)();
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
                        attrs: createGoalItem.attr,
                    },
                    {
                        title: tr('Create project'),
                        event: ModalEvent.ProjectCreateModal,
                        attrs: createProjectItem.attr,
                    },
                ]}
                renderTrigger={(props) => (
                    <Button
                        view="primary"
                        outline
                        brick="left"
                        iconRight={
                            props.visible ? (
                                <IconUpSmallSolid size="s" noWrap />
                            ) : (
                                <IconDownSmallSolid size="s" noWrap />
                            )
                        }
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
