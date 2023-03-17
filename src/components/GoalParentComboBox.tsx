import React, { ChangeEvent, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import useSWR from 'swr';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';

import { Button } from '@common/Button';

import { createFetcher } from '../utils/createFetcher';
import { Project } from '../../graphql/@generated/genql';
import { usePageContext } from '../hooks/usePageContext';
import { useLocalStorage } from '../hooks/useLocalStorage';

import { Input } from './Input';
import { ProjectMenuItem } from './ProjectMenuItem';
import { MenuGroupItem } from './MenuGroupItem';

const ComboBox = dynamic(() => import('@common/ComboBox'));

interface GoalParentComboBoxProps {
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
            key: true,
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
    teamCompletion: [
        {
            query,
        },
        {
            id: true,
            key: true,
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

export const GoalParentComboBox = React.forwardRef<HTMLDivElement, GoalParentComboBoxProps>(
    ({ text, query = '', value, placeholder, disabled, error, onChange }, ref) => {
        const { user } = usePageContext();
        const t = useTranslations('GoalParentComboBox');
        const [completionVisible, setCompletionVisibility] = useState(false);
        const [inputState, setInputState] = useState(value?.title || query);
        const [recentProjectsCache] = useLocalStorage('recentProjectsCache', {});

        useEffect(() => {
            setInputState(value?.title || query);
        }, [value, query]);

        const { data } = useSWR(inputState, (q) => fetcher(user, q));

        const recentProjects = Object.values(recentProjectsCache)
            .sort((a, b) => b.rate - a.rate)
            .slice(0, 10) // top 10
            .map((p) => p.cache);

        const items = useMemo(
            () => [
                [
                    (data?.projectCompletion && data?.projectCompletion?.length > 0
                        ? data?.projectCompletion
                        : recentProjects
                    )?.map((p) => ({ ...p, kind: 'project' })),
                ],
                [data?.teamCompletion?.map((p) => ({ ...p, kind: 'team' }))],
            ],
            [data, recentProjects],
        );

        return (
            <ComboBox
                ref={ref}
                text={value ? `#${value?.key}` : text}
                value={inputState}
                visible={completionVisible}
                error={error}
                disabled={disabled}
                placement="top-start"
                items={items}
                onChange={onChange}
                renderTrigger={(props) => (
                    <Button disabled={props.disabled} ref={props.ref} text={props.text} onClick={props.onClick} />
                )}
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
                renderItem={(props) => ({
                    id: props.item.id,
                    title: props.item.title,
                    key: props.item.key,
                    kind: props.item.kind,
                    focused: props.cursor === props.index,
                    onClick: props.onClick,
                })}
                renderItems={(entities) => {
                    const groups = (entities as Array<Record<any, any>>)?.reduce((r, a) => {
                        r[a.kind] = r[a.kind] || [];
                        r[a.kind].push(a);
                        return r;
                    }, Object.create(null));

                    return Object.values(groups).map((gr: any) => (
                        <MenuGroupItem key={gr[0].kind} title={t(gr[0].kind)}>
                            {gr.map((entity: any) => (
                                <ProjectMenuItem
                                    key={entity.id}
                                    title={entity.title}
                                    focused={entity.focused}
                                    onClick={entity.onClick}
                                />
                            ))}
                        </MenuGroupItem>
                    ));
                }}
            />
        );
    },
);
