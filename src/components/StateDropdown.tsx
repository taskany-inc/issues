import React, { useCallback, useEffect, useState } from 'react';
import { Dropdown } from '@taskany/bricks';
import { IconGitPullOutline } from '@taskany/icons';
import { State } from '@prisma/client';
import { Button } from '@taskany/bricks/harmony';

import { trpc } from '../utils/trpcClient';
import { stateCombobox } from '../utils/domObjects';

import { StateDot } from './StateDot';
import { ColorizedMenuItem } from './ColorizedMenuItem';

interface StateDropdownProps {
    text: React.ComponentProps<typeof Button>['text'];
    disabled?: boolean;
    value?: Partial<State>;
    flowId?: string;
    error?: React.ComponentProps<typeof Dropdown>['error'];

    onChange?: (state: State) => void;
}

export const StateDropdown = React.forwardRef<HTMLDivElement, StateDropdownProps & React.RefAttributes<HTMLDivElement>>(
    ({ text, value, flowId, error, disabled, onChange, ...attrs }, ref) => {
        const [state, setState] = useState(value);

        const defaultFlowEnabled = !flowId && !disabled;

        const { data: flowById } = trpc.flow.getById.useQuery(flowId, {
            enabled: !!flowId,
        });

        const { data: defaultFlow } = trpc.flow.recommedations.useQuery(undefined, {
            enabled: defaultFlowEnabled,
            refetchOnMount: 'always',
            select([flow]) {
                return flow;
            },
        });

        const flow = defaultFlowEnabled ? defaultFlow : flowById;

        const onStateChange = useCallback(
            (s: Partial<State>) => {
                setState(s);
                onChange?.(s as State);
            },
            [onChange],
        );

        useEffect(() => {
            if (value) return;
            const defaultState = flow?.states.find((state) => state.default === true);
            defaultState && onStateChange(defaultState);
        }, [flow, onStateChange, value]);

        return (
            <Dropdown
                ref={ref}
                error={error}
                text={state?.title || text}
                value={state}
                onChange={onStateChange}
                items={flow?.states}
                disabled={disabled}
                renderTrigger={(props) => (
                    <Button
                        ref={props.ref}
                        text={props.text}
                        onClick={props.onClick}
                        disabled={props.disabled}
                        iconLeft={state ? <StateDot hue={state.hue} /> : <IconGitPullOutline size="xs" />}
                        {...stateCombobox.attr}
                    />
                )}
                renderItem={(props) => (
                    <ColorizedMenuItem
                        key={props.item.id}
                        hue={props.item.hue}
                        focused={props.cursor === props.index}
                        onClick={props.onClick}
                    >
                        {props.item.title}
                    </ColorizedMenuItem>
                )}
                {...attrs}
            />
        );
    },
);
