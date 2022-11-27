import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import colorLayer from 'color-layer';
import dynamic from 'next/dynamic';

import { createFetcher } from '../utils/createFetcher';
import { pageContext } from '../utils/pageContext';
import { State } from '../../graphql/@generated/genql';

import { ColorizedMenuItem } from './ColorizedMenuItem';
import { FiltersMenuItem } from './FiltersMenuItem';

const Dropdown = dynamic(() => import('./Dropdown'));

interface StateFilterDropdownProps {
    text: React.ComponentProps<typeof Dropdown>['text'];
    flowId?: string;
    value?: Array<string>;
    disabled?: React.ComponentProps<typeof Dropdown>['disabled'];

    onChange?: (selected: string[]) => void;
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

export const StateFilterDropdown = React.forwardRef<HTMLDivElement, StateFilterDropdownProps>(
    ({ text, flowId, value, disabled, onChange }, ref) => {
        const { data: session } = useSession();
        const { theme } = useContext(pageContext);
        const [themeId, setThemeId] = useState(0); // default: dark
        const [selected, setSelected] = useState<Set<string>>(new Set(value));

        const { data } = useSWR(flowId, (id) => fetcher(session?.user, id));

        useEffect(() => {
            theme && setThemeId(mapThemeOnId[theme]);
        }, [theme]);

        const colors = useMemo(
            () => data?.flow?.states?.map((f) => colorLayer(f.hue, 5, f.hue === 1 ? 0 : undefined)[themeId]) || [],
            [themeId, data?.flow?.states],
        );

        const onStateClick = useCallback(
            (s: State) => {
                selected.has(s.id) ? selected.delete(s.id) : selected.add(s.id);
                const newSelected = new Set(selected);
                setSelected(newSelected);

                onChange?.(Array.from(newSelected));
            },
            [onChange, selected],
        );

        return (
            <Dropdown
                ref={ref}
                text={text}
                value={value}
                onChange={onStateClick}
                items={data?.flow?.states}
                disabled={disabled}
                renderTrigger={(props) => (
                    <FiltersMenuItem
                        ref={props.ref}
                        active={Boolean(Array.from(selected).length)}
                        disabled={props.disabled}
                        onClick={props.onClick}
                    >
                        {props.text}
                    </FiltersMenuItem>
                )}
                renderItem={(props) => (
                    <ColorizedMenuItem
                        key={props.item.id}
                        hue={props.item.hue}
                        title={props.item.title}
                        hoverColor={colors[props.index]}
                        checked={selected?.has(props.item.id)}
                        onClick={props.onClick}
                    />
                )}
            />
        );
    },
);
