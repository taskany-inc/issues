import { FC, MutableRefObject, useCallback, useMemo } from 'react';
import { IconUpSmallSolid, IconDownSmallSolid } from '@taskany/icons';
import { Button, Text } from '@taskany/bricks/harmony';

import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import {
    createFastButton,
    createGoalItem,
    createProjectItem,
    createSelectButton,
    createPersonalGoalItem,
} from '../../utils/domObjects';
import { Dropdown, DropdownPanel, DropdownTrigger } from '../Dropdown/Dropdown';

import { tr } from './PageHeaderActionButton.i18n';

export const PageHeaderActionButton: FC = () => {
    const onMenuItemClick = useCallback(({ event, params }: { event: ModalEvent; params: unknown }) => {
        dispatchModalEvent(event, params)();
    }, []);

    const options = useMemo(() => {
        return [
            {
                id: tr('Create goal'),
                title: tr('Create goal'),
                event: ModalEvent.GoalCreateModal,
                params: {},
                attrs: createGoalItem.attr,
            },
            {
                id: tr('Create personal goal'),
                title: tr('Create personal goal'),
                event: ModalEvent.GoalCreateModal,
                params: {
                    personal: true,
                },
                attrs: createPersonalGoalItem.attr,
            },
            {
                id: tr('Create project'),
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
            <Dropdown>
                <DropdownTrigger
                    renderTrigger={(props) => (
                        <Button
                            view="primary"
                            brick="left"
                            iconRight={props.isOpen ? <IconUpSmallSolid size="s" /> : <IconDownSmallSolid size="s" />}
                            ref={props.ref as MutableRefObject<HTMLButtonElement>}
                            onClick={props.onClick}
                            {...createSelectButton.attr}
                        />
                    )}
                />
                <DropdownPanel
                    placement="top-end"
                    items={options}
                    mode="single"
                    onChange={onMenuItemClick}
                    renderItem={(props) => (
                        <Text size="s" onClick={() => onMenuItemClick(props.item)} {...props.item.attrs}>
                            {props.item.title}
                        </Text>
                    )}
                />
            </Dropdown>
        </>
    );
};
