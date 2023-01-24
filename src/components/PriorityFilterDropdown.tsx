import React, { useCallback, useMemo, useState } from 'react';
import useSWR from 'swr';
import colorLayer from 'color-layer';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';

import { createFetcher } from '../utils/createFetcher';
import { Priority } from '../../graphql/@generated/genql';
import { usePageContext } from '../hooks/usePageContext';

import { ColorizedMenuItem } from './ColorizedMenuItem';
import { FiltersMenuItem } from './FiltersMenuItem';

const Dropdown = dynamic(() => import('./Dropdown'));

interface PriorityFilterDropdownProps {
    text: React.ComponentProps<typeof Dropdown>['text'];
    value?: Array<string>;
    disabled?: React.ComponentProps<typeof Dropdown>['disabled'];

    onChange?: (selected: string[]) => void;
}

const fetcher = createFetcher(() => ({
    goalPriorityKind: true,
    goalPriorityColors: true,
}));

export const PriorityFilterDropdown = React.forwardRef<HTMLDivElement, PriorityFilterDropdownProps>(
    ({ text, value, disabled, onChange }, ref) => {
        const t = useTranslations('Priority');
        const { user, themeId } = usePageContext();
        const [selected, setSelected] = useState<Set<string>>(new Set(value));

        const { data } = useSWR('priority', () => fetcher(user));

        const colors = useMemo(
            () => data?.goalPriorityColors?.map((hue) => colorLayer(hue!, 5, hue === 1 ? 0 : undefined)[themeId]) || [],
            [themeId, data?.goalPriorityColors],
        );

        const onPriorityClick = useCallback(
            (p: Priority) => {
                selected.has(p) ? selected.delete(p) : selected.add(p);
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
                onChange={onPriorityClick}
                items={data?.goalPriorityKind}
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
                        key={props.item}
                        hue={data?.goalPriorityColors?.[data?.goalPriorityKind?.indexOf(props.item || '') ?? -1]}
                        title={t(props.item)}
                        hoverColor={colors[props.index]}
                        checked={selected?.has(props.item)}
                        onClick={props.onClick}
                    />
                )}
            />
        );
    },
);
