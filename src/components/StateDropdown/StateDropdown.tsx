import { State as StateType } from '@prisma/client';
import { ComponentProps, useEffect, useMemo } from 'react';
import { State, StateGroup } from '@taskany/bricks/harmony';
import { nullable } from '@taskany/bricks';

import { trpc } from '../../utils/trpcClient';
import { Dropdown, DropdownTrigger, DropdownPanel, DropdownGuardedProps } from '../Dropdown/Dropdown';
import { usePageContext } from '../../hooks/usePageContext';

type StateDropdownProps = {
    error?: ComponentProps<typeof DropdownTrigger>['error'];
    label?: ComponentProps<typeof DropdownTrigger>['label'];
    view?: ComponentProps<typeof DropdownTrigger>['view'];
    disabled?: boolean;
    readOnly?: boolean;
    setDefault?: boolean;
    className?: string;
    value?: StateType | StateType[];
    flowId?: string;
    onClose?: () => void;
} & DropdownGuardedProps<StateType>;

export const StateDropdown = ({ value, flowId, mode, setDefault, onChange, onClose, ...props }: StateDropdownProps) => {
    const { theme } = usePageContext();
    const defaultFlowEnabled = !flowId && !props.disabled;

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
        if (value || !setDefault) return;

        const defaultState = flow?.states.find((state) => state.default === true);
        if (!defaultState) return;

        if (mode === 'single') onChange?.(defaultState);
        if (mode === 'multiple') onChange?.([defaultState]);
    }, [flow, mode, onChange, setDefault, value]);

    const values = useMemo(() => {
        const res: StateType[] = [];
        return res.concat(value || []).reduce<(StateType & { color?: string })[]>((acc, cur) => {
            if (cur) {
                acc.push({ ...cur, color: cur[`${theme}Foreground`] || undefined });
            }
            return acc;
        }, []);
    }, [theme, value]);

    return (
        <Dropdown arrow onClose={onClose}>
            <DropdownTrigger {...props}>
                {nullable(
                    mode === 'multiple' && values.length > 1,
                    () => (
                        <StateGroup items={values} />
                    ),
                    nullable(values, ([{ title, ...props }]) => (
                        <State color={props[`${theme}Foreground`] || undefined} title={title} />
                    )),
                )}
            </DropdownTrigger>
            <DropdownPanel
                width={160}
                value={values}
                items={flow?.states}
                selectable
                mode={mode}
                onChange={onChange}
                renderItem={(props) => (
                    <State color={props.item[`${theme}Foreground`] || undefined} title={props.item?.title} />
                )}
            />
        </Dropdown>
    );
};
