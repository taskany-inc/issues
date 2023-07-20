import React, { useCallback, useEffect, useState } from 'react';
import { Button, Dropdown, FlowIcon } from '@taskany/bricks';
import { State } from '@prisma/client';

import { trpc } from '../utils/trpcClient';

import { StateDot } from './StateDot';
import { ColorizedMenuItem } from './ColorizedMenuItem';

interface StateDropdownProps {
    text: React.ComponentProps<typeof Button>['text'];
    disabled?: boolean;
    value?: Partial<State>;
    flowId: string;
    error?: React.ComponentProps<typeof Dropdown>['error'];

    onChange?: (state: State) => void;
}

export const StateDropdown = React.forwardRef<HTMLDivElement, StateDropdownProps>(
    ({ text, value, flowId, error, disabled, onChange }, ref) => {
        const [state, setState] = useState(value);

        const flowById = trpc.flow.getById.useQuery(flowId);

        useEffect(() => {
            const defaultState = flowById?.data?.states?.filter((s) => s?.default)[0];
            if (!value && defaultState) {
                setState(defaultState);
                onChange?.(defaultState);
            }
        }, [value, onChange, flowById]);

        const onStateChange = useCallback(
            (s: Partial<State>) => {
                setState(s);
                onChange?.(s as State);
            },
            [onChange],
        );

        return (
            <Dropdown
                ref={ref}
                error={error}
                text={state?.title || text}
                value={state}
                onChange={onStateChange}
                items={flowById?.data?.states}
                disabled={disabled}
                renderTrigger={(props) => (
                    <Button
                        ref={props.ref}
                        text={props.text}
                        onClick={props.onClick}
                        disabled={props.disabled}
                        iconLeft={state ? <StateDot hue={state.hue} /> : <FlowIcon noWrap size="xs" />}
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
            />
        );
    },
);
