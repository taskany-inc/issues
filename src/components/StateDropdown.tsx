/* eslint-disable react/display-name */
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import colorLayer from 'color-layer';
import dynamic from 'next/dynamic';

import { createFetcher } from '../utils/createFetcher';
import { pageContext } from '../utils/pageContext';
import { State } from '../../graphql/@generated/genql';

import { Button } from './Button';
import { Icon } from './Icon';
import { StateDot } from './StateDot';
import { StateDropdownItem } from './StateDropdownItem';

const Dropdown = dynamic(() => import('./Dropdown'));

interface StateDropdownProps {
    text: React.ComponentProps<typeof Button>['text'];
    disabled?: boolean;
    value?: Partial<State>;
    flowId?: string;
    error?: React.ComponentProps<typeof Dropdown>['error'];

    onChange?: (state: State) => void;
}

const mapThemeOnId = { light: 0, dark: 1 };

const fetcher = createFetcher((_, id: string) => ({
    flow: [
        {
            id,
        },
        {
            id: true,
            title: true,
            states: {
                id: true,
                title: true,
                hue: true,
                default: true,
            },
        },
    ],
}));

export const StateDropdown = React.forwardRef<HTMLDivElement, StateDropdownProps>(
    ({ text, value, flowId, error, disabled, onChange }, ref) => {
        const { data: session } = useSession();
        const { theme } = useContext(pageContext);
        const [themeId, setThemeId] = useState(0);
        const [state, setState] = useState(value);

        const { data } = useSWR(flowId, (id) => fetcher(session?.user, id));

        useEffect(() => {
            theme && setThemeId(mapThemeOnId[theme]);
        }, [theme]);

        useEffect(() => {
            const defaultState = data?.flow?.states?.filter((s) => s?.default)[0];
            if (!value && defaultState) {
                setState(defaultState);
                onChange && onChange(defaultState);
            }
        }, [value, onChange, data?.flow?.states]);

        const onStateChange = useCallback(
            (s: Partial<State>) => {
                setState(s);
                onChange && onChange(s as State);
            },
            [onChange],
        );

        const colors = useMemo(
            () => data?.flow?.states?.map((f) => colorLayer(f.hue, 5, f.hue === 1 ? 0 : undefined)[themeId]) || [],
            [themeId, data?.flow?.states],
        );

        return (
            <Dropdown
                ref={ref}
                error={error}
                text={state?.title || text}
                value={state}
                onChange={onStateChange}
                items={data?.flow?.states}
                disabled={!flowId || disabled}
                renderTrigger={(props) => (
                    <Button
                        ref={props.ref}
                        text={props.text}
                        onClick={props.onClick}
                        disabled={props.disabled}
                        iconLeft={state ? <StateDot hue={state.hue} /> : <Icon noWrap type="flow" size="xs" />}
                    />
                )}
                renderItem={(props) => (
                    <StateDropdownItem
                        key={props.item.id}
                        hue={props.item.hue}
                        title={props.item.title}
                        hoverColor={colors[props.index]}
                        focused={props.cursor === props.index}
                        onClick={props.onClick}
                    />
                )}
            />
        );
    },
);
