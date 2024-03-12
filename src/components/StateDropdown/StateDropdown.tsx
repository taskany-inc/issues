import { State as StateType } from '@prisma/client';
import { ComponentProps, useCallback, useEffect } from 'react';
import { State } from '@taskany/bricks/harmony';
import { nullable } from '@taskany/bricks';

import { trpc } from '../../utils/trpcClient';
import { Dropdown, DropdownTrigger, DropdownPanel } from '../Dropdown/Dropdown';
import { StateWrapper } from '../StateWrapper';

interface StateDropdownProps {
    error?: ComponentProps<typeof DropdownTrigger>['error'];
    label?: ComponentProps<typeof DropdownTrigger>['label'];
    view?: ComponentProps<typeof DropdownTrigger>['view'];
    disabled?: boolean;
    readOnly?: boolean;
    className?: string;
    value?: Partial<StateType>;
    flowId?: string;

    onChange?: (state: StateType) => void;
}

export const StateDropdown = ({ value, flowId, onChange, ...props }: StateDropdownProps) => {
    const defaultFlowEnabled = !flowId && !props.disabled;

    const onStateChange = useCallback(
        (s: Partial<StateType>) => {
            onChange?.(s as StateType);
        },
        [onChange],
    );

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

    useEffect(() => {
        if (value) return;
        const defaultState = flow?.states.find((state) => state.default === true);
        defaultState && onStateChange(defaultState);
    }, [flow, onStateChange, value]);

    return (
        <Dropdown arrow>
            <DropdownTrigger {...props}>
                {nullable(value, ({ hue, title }) => (
                    <StateWrapper hue={hue}>
                        <State color="var(--state-stroke)" title={title} />
                    </StateWrapper>
                ))}
            </DropdownTrigger>
            <DropdownPanel
                width={160}
                value={value}
                items={flow?.states}
                selectable
                onChange={onStateChange}
                renderItem={(props) => (
                    <StateWrapper hue={props.item?.hue}>
                        <State color="var(--state-stroke)" title={props.item?.title} />
                    </StateWrapper>
                )}
            />
        </Dropdown>
    );
};
