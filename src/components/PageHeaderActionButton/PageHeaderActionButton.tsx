import { FC, useCallback, useMemo } from 'react';
import { MenuItem } from '@taskany/bricks';
import { IconUpSmallSolid, IconDownSmallSolid } from '@taskany/icons';
import { Button, Dropdown, DropdownPanel, DropdownTrigger } from '@taskany/bricks/harmony';

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

    const options = useMemo(() => {
        return [
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
        ];
    }, []);

    return (
        <>
            <Button
                text={tr('Create')}
                view="primary"
                brick="right"
                onClick={dispatchModalEvent(ModalEvent.GoalCreateModal)}
                {...createFastButton.attr}
            />
            <Dropdown hideOnClick>
                <DropdownTrigger
                    arrow={false}
                    renderTrigger={(props) => (
                        <Button
                            view="primary"
                            brick="left"
                            iconRight={props.isOpen ? <IconUpSmallSolid size="s" /> : <IconDownSmallSolid size="s" />}
                            ref={props.ref}
                            onClick={props.onClick}
                            {...createSelectButton.attr}
                        />
                    )}
                />
                <DropdownPanel placement="top-end" arrow>
                    {options.map((option) => (
                        <MenuItem
                            key={option.title}
                            onClick={() => onMenuItemClick(option)}
                            view="primary"
                            ghost
                            {...option.attrs}
                        >
                            {option.title}
                        </MenuItem>
                    ))}
                </DropdownPanel>
            </Dropdown>
        </>
    );
};
