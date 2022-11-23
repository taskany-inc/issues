/* eslint-disable react/display-name */
import React, { ChangeEvent, useState } from 'react';
import styled from 'styled-components';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import dynamic from 'next/dynamic';

import { createFetcher } from '../utils/createFetcher';
import { Project } from '../../graphql/@generated/genql';

import { Button } from './Button';
import { Input } from './Input';
import { ProjectMenuItem } from './ProjectMenuItem';

const ComboBox = dynamic(() => import('./ComboBox'));

interface ProjectComboBoxProps {
    text: React.ComponentProps<typeof ComboBox>['text'];
    value?: Partial<Project>;
    query?: string;
    placeholder?: string;
    disabled?: boolean;
    error?: React.ComponentProps<typeof ComboBox>['error'];

    onChange?: (project: Project) => void;
}

const StyledInput = styled(Input)`
    min-width: 100px;
`;

const fetcher = createFetcher((_, query: string) => ({
    projectCompletion: [
        {
            query,
        },
        {
            id: true,
            title: true,
            description: true,
            flowId: true,
            flow: {
                id: true,
                title: true,
                states: {
                    id: true,
                    title: true,
                    default: true,
                },
            },
        },
    ],
}));

export const ProjectComboBox = React.forwardRef<HTMLDivElement, ProjectComboBoxProps>(
    ({ text, query = '', value, placeholder, disabled, error, onChange }, ref) => {
        const { data: session } = useSession();
        const [completionVisible, setCompletionVisibility] = useState(false);
        const [inputState, setInputState] = useState(value?.title || query);

        const { data } = useSWR(inputState, (q) => fetcher(session?.user, q));

        return (
            <ComboBox
                ref={ref}
                text={value?.title || text}
                value={inputState}
                visible={completionVisible}
                error={error}
                disabled={disabled}
                items={data?.projectCompletion}
                onChange={onChange}
                renderTrigger={(props) => <Button ref={props.ref} text={props.text} onClick={props.onClick} />}
                renderInput={(props) => (
                    <StyledInput
                        autoFocus
                        placeholder={placeholder}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            setInputState(e.currentTarget.value);
                            setCompletionVisibility(true);
                        }}
                        {...props}
                    />
                )}
                renderItem={(props) => (
                    <ProjectMenuItem
                        key={props.item.id}
                        title={props.item.title}
                        focused={props.cursor === props.index}
                        onClick={props.onClick}
                    />
                )}
            />
        );
    },
);
