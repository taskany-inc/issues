/* eslint-disable react/display-name */
import React from 'react';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';

import { createFetcher } from '../utils/createFetcher';
import { Priority } from '../../graphql/@generated/genql';

import { Button } from './Button';
import { MenuItem } from './MenuItem';

const Dropdown = dynamic(() => import('./Dropdown'));

interface PriorityDropdownProps {
    text: React.ComponentProps<typeof Button>['text'];
    value?: string;
    disabled?: React.ComponentProps<typeof Dropdown>['disabled'];
    error?: React.ComponentProps<typeof Dropdown>['error'];

    onChange?: (priority: Priority) => void;
}

const fetcher = createFetcher(() => ({
    goalPriorityKind: true,
}));

export const PriorityDropdown = React.forwardRef<HTMLDivElement, PriorityDropdownProps>(
    ({ text, value, disabled, error, onChange }, ref) => {
        const t = useTranslations('PriorityDropdown');
        const { data: session } = useSession();
        const { data } = useSWR('priority', () => fetcher(session?.user));

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
                    <Button ref={props.ref} text={props.text} onClick={props.onClick} disabled={props.disabled} />
                )}
                renderItem={(props) => (
                    <MenuItem
                        key={props.item}
                        focused={props.cursor === props.index}
                        selected={props.item === value}
                        onClick={props.onClick}
                    >
                        {t(`Priority.${props.item}`)}
                    </MenuItem>
                )}
            />
        );
    },
);
