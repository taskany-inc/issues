import React, { useState, ChangeEvent } from 'react';
import styled from 'styled-components';
import useSWR from 'swr';
import dynamic from 'next/dynamic';

import { Button } from '@common/Button';
import { Input } from '@common/Input';

import { createFetcher } from '../utils/createFetcher';
import { Activity } from '../../graphql/@generated/genql';
import { usePageContext } from '../hooks/usePageContext';

import { UserMenuItem } from './UserMenuItem';
import { UserPic } from './UserPic';

const ComboBox = dynamic(() => import('@common/ComboBox'));

interface UserComboBoxProps {
    text: React.ComponentProps<typeof Button>['text'];
    query?: string;
    value?: Partial<Activity>;
    disabled?: boolean;
    placeholder?: string;
    filter?: string[];
    error?: React.ComponentProps<typeof ComboBox>['error'];

    onChange?: (activity: Activity) => void;
}

const StyledInput = styled(Input)`
    min-width: 100px;
`;

const fetcher = createFetcher((_, query: string, filter?: string[]) => ({
    findActivity: [
        {
            data: {
                query,
                filter,
            },
        },
        {
            id: true,
            user: {
                id: true,
                name: true,
                email: true,
                image: true,
            },
            ghost: {
                id: true,
                email: true,
            },
        },
    ],
}));

export const UserComboBox = React.forwardRef<HTMLDivElement, UserComboBoxProps>(
    ({ text, query = '', value, filter, disabled, placeholder, error, onChange }, ref) => {
        const { user } = usePageContext();
        const [completionVisible, setCompletionVisibility] = useState(false);
        const [inputState, setInputState] = useState(
            value?.user?.name || value?.user?.email || value?.ghost?.email || query,
        );

        const { data } = useSWR(inputState, (q) => fetcher(user, q, filter));

        return (
            <ComboBox
                ref={ref}
                text={value?.user?.name || value?.user?.email || value?.ghost?.email || text}
                value={inputState}
                visible={completionVisible}
                disabled={disabled}
                error={error}
                placement="top-start"
                items={data?.findActivity}
                onChange={onChange}
                renderTrigger={(props) => (
                    <Button
                        ref={props.ref}
                        text={props.text}
                        disabled={props.disabled}
                        onClick={props.onClick}
                        iconLeft={
                            <UserPic
                                src={value?.user?.image}
                                email={value?.user?.email || value?.ghost?.email}
                                size={16}
                            />
                        }
                    />
                )}
                renderInput={(props) => (
                    <StyledInput
                        autoFocus
                        disabled={props.disabled}
                        placeholder={placeholder}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            setInputState(e.currentTarget.value);
                            setCompletionVisibility(true);
                        }}
                        {...props}
                    />
                )}
                renderItem={(props) => (
                    <UserMenuItem
                        key={props.item.id}
                        name={props.item.user?.name}
                        email={props.item.user?.email || props.item.ghost?.email}
                        image={props.item.user?.image}
                        focused={props.cursor === props.index}
                        onClick={props.onClick}
                    />
                )}
            />
        );
    },
);
