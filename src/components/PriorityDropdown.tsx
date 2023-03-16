import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import colorLayer from 'color-layer';

import { Button } from '@common/Button';

import { usePageContext } from '../hooks/usePageContext';
import { Priority, priorityColorsMap } from '../types/priority';
import { trPriority } from '../i18n/priority';

import { StateDot } from './StateDot';
import { ColorizedMenuItem } from './ColorizedMenuItem';

const Dropdown = dynamic(() => import('@common/Dropdown'));

interface PriorityDropdownProps {
    text: React.ComponentProps<typeof Button>['text'];
    value?: string | null;
    disabled?: React.ComponentProps<typeof Dropdown>['disabled'];
    error?: React.ComponentProps<typeof Dropdown>['error'];

    onChange?: (priority: Priority) => void;
}

export const PriorityDropdown = React.forwardRef<HTMLDivElement, PriorityDropdownProps>(
    ({ text, value, disabled, error, onChange }, ref) => {
        const { themeId } = usePageContext();

        const priorityVariants = Object.keys(priorityColorsMap) as Priority[];

        const colors = useMemo(() => {
            const themeColorsMap = priorityVariants.reduce((acc, key: Priority) => {
                acc[key] = colorLayer(priorityColorsMap[key], 5, priorityColorsMap[key] === 1 ? 0 : undefined)[themeId];

                return acc;
            }, Object.create({}));

            return themeColorsMap;
        }, [themeId, priorityVariants]);

        return (
            <Dropdown
                ref={ref}
                error={error}
                text={value || text}
                value={value}
                onChange={onChange}
                items={priorityVariants}
                disabled={disabled}
                renderTrigger={(props) => (
                    <Button
                        ref={props.ref}
                        onClick={props.onClick}
                        disabled={props.disabled}
                        iconLeft={<StateDot hue={priorityColorsMap[props.value as Priority]} />}
                    />
                )}
                renderItem={(props) => (
                    <ColorizedMenuItem
                        key={props.item}
                        hue={priorityColorsMap[props.item as Priority]}
                        title={trPriority(props.item as Priority)}
                        hoverColor={colors[props.index]}
                        focused={props.cursor === props.index}
                        onClick={props.onClick}
                    />
                )}
            />
        );
    },
);
