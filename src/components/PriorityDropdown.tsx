import React, { useMemo } from 'react';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import colorLayer from 'color-layer';

import { createFetcher } from '../utils/createFetcher';
import { Priority } from '../../graphql/@generated/genql';
import { usePageContext } from '../hooks/usePageContext';

import { Button } from './Button';
import { StateDot } from './StateDot';
import { ColorizedMenuItem } from './ColorizedMenuItem';

const Dropdown = dynamic(() => import('./Dropdown'));

interface PriorityDropdownProps {
    text: React.ComponentProps<typeof Button>['text'];
    value?: string | null;
    disabled?: React.ComponentProps<typeof Dropdown>['disabled'];
    error?: React.ComponentProps<typeof Dropdown>['error'];

    onChange?: (priority: Priority) => void;
}

const fetcher = createFetcher(() => ({
    goalPriorityKind: true,
    goalPriorityColors: true,
}));

export const PriorityDropdown = React.forwardRef<HTMLDivElement, PriorityDropdownProps>(
    ({ text, value, disabled, error, onChange }, ref) => {
        const t = useTranslations('Priority');
        const { user, themeId } = usePageContext();

        const { data } = useSWR('priority', () => fetcher(user));

        const colors = useMemo(
            () => data?.goalPriorityColors?.map((hue) => colorLayer(hue!, 5, hue === 1 ? 0 : undefined)[themeId]) || [],
            [themeId, data?.goalPriorityColors],
        );

        const colorIndex = data?.goalPriorityKind?.indexOf(value || '') ?? -1;

        return (
            <Dropdown
                ref={ref}
                error={error}
                text={value || text}
                value={value}
                onChange={onChange}
                items={data?.goalPriorityKind}
                disabled={disabled}
                renderTrigger={(props) => (
                    <Button
                        ref={props.ref}
                        onClick={props.onClick}
                        disabled={props.disabled}
                        iconLeft={
                            colorIndex !== -1 ? <StateDot hue={data?.goalPriorityColors?.[colorIndex]} /> : undefined
                        }
                    />
                )}
                renderItem={(props) => (
                    <ColorizedMenuItem
                        key={props.item}
                        hue={data?.goalPriorityColors?.[props.index]}
                        title={t(props.item)}
                        hoverColor={colors[props.index]}
                        focused={props.cursor === props.index}
                        onClick={props.onClick}
                    />
                )}
            />
        );
    },
);
