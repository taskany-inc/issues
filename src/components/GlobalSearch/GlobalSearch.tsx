/* eslint-disable no-nested-ternary */
import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import NextLink from 'next/link';
import { Text, Table, nullable, ListView, ListViewItem, GlobalSearch as TaskanyGlobalSearch } from '@taskany/bricks';
import { IconTargetOutline, IconUsersOutline } from '@taskany/icons';
import { gapS, gapXs, gray4, radiusM } from '@taskany/colors';

import { trpc } from '../../utils/trpcClient';
import { routes, useRouter } from '../../hooks/router';
import { GoalListItemCompact } from '../GoalListItemCompact';
import { ProjectListItemCompact } from '../ProjectListItemCompact';

import { tr } from './GlobalSearch.i18n';

type ListViewItemValue = ['goal' | 'project', string];

// TODO: https://github.com/taskany-inc/issues/issues/1568
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const StyledGoalListItemCompact = styled(({ hovered, ...props }) => <GoalListItemCompact {...props} />)<{
    hovered?: boolean;
}>`
    padding: ${gapXs} ${gapS};
    border-radius: ${radiusM};
    cursor: pointer;

    &:hover {
        background-color: transparent;
    }

    ${({ hovered }) =>
        hovered &&
        `
        &:hover {
            background-color: ${gray4};
        }

        background-color: ${gray4};
    `}

    ${({ hovered, focused }) =>
        hovered &&
        focused &&
        `
        &:hover {
            background-color: ${gray4};
        }

        background-color: ${gray4};
    `}

    ${({ focused }) =>
        focused &&
        `
        &:hover {
            background-color: ${gray4};
        }

        background-color: ${gray4};
    `}
`;

// TODO: https://github.com/taskany-inc/issues/issues/1568
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const StyledProjectListItemCompact = styled(({ hovered, ...props }) => <ProjectListItemCompact {...props} />)<{
    hovered?: boolean;
}>`
    ${({ hovered }) =>
        hovered &&
        `

        &:hover {
            background-color: ${gray4};
        }

        background-color: ${gray4};
    `}

    ${({ hovered, focused }) =>
        hovered &&
        focused &&
        `
        &:hover {
            background-color: ${gray4};
        }

        background-color: ${gray4};
    `}

    ${({ focused }) =>
        focused &&
        `
        &:hover {
            background-color: ${gray4};
        }

        background-color: ${gray4};
    `}
`;

const StyledGroupHeader = styled(Text)`
    display: flex;
    align-items: center;
    justify-content: space-between;

    box-sizing: border-box;

    padding-top: ${gapS};
    padding-bottom: ${gapXs};
    margin: 0 ${gapS};

    max-width: 392px;

    border-bottom: 1px solid ${gray4};
`;

const tableWidth = 700;

export const GlobalSearch = () => {
    const [query, setQuery] = useState('');
    const router = useRouter();

    const suggestions = trpc.search.global.useQuery(query, {
        enabled: query.length >= 3,
        cacheTime: 0,
        staleTime: 0,
    });

    const onKeyboardNavigate = useCallback(
        ([entity, id]: ListViewItemValue) => {
            router[entity](id);
        },
        [router],
    );
    const resultsExists = Boolean(suggestions.data?.goals?.length || suggestions.data?.projects.length);
    return (
        <TaskanyGlobalSearch
            query={query}
            setQuery={setQuery}
            searchResultExists={resultsExists}
            placeholder={tr('Search or jump to...')}
        >
            <ListView onKeyboardClick={onKeyboardNavigate}>
                {nullable(suggestions.data?.goals?.length, () => (
                    <>
                        <StyledGroupHeader size="m" weight="bolder">
                            {tr('Goals')} <IconTargetOutline size="s" />
                        </StyledGroupHeader>
                        <Table width={tableWidth}>
                            {suggestions.data?.goals.map((item) => {
                                const value: ListViewItemValue = ['goal', item._shortId];

                                return (
                                    <ListViewItem
                                        key={item.id}
                                        value={value}
                                        renderItem={({ active, ...props }) => (
                                            <NextLink passHref href={routes.goal(item._shortId)} legacyBehavior>
                                                <StyledGoalListItemCompact
                                                    focused={active}
                                                    align="center"
                                                    gap={10}
                                                    item={item}
                                                    columns={[
                                                        { name: 'title', columnProps: { col: 3 } },
                                                        {
                                                            name: 'state',
                                                            columnProps: { col: 1, justify: 'end' },
                                                        },
                                                        {
                                                            name: 'priority',
                                                            columnProps: { width: '12ch' },
                                                        },
                                                        { name: 'projectId', columnProps: { col: 3 } },
                                                        { name: 'issuers' },
                                                        { name: 'estimate', columnProps: { width: '8ch' } },
                                                    ]}
                                                    {...props}
                                                />
                                            </NextLink>
                                        )}
                                    />
                                );
                            })}
                        </Table>
                    </>
                ))}
                {nullable(suggestions.data?.projects?.length, () => (
                    <>
                        <StyledGroupHeader size="m" weight="bolder">
                            {tr('Projects')} <IconUsersOutline size="s" />
                        </StyledGroupHeader>
                        <Table width={tableWidth}>
                            {suggestions.data?.projects?.map((item) => (
                                <ListViewItem
                                    key={item.id}
                                    value={['project', item.id]}
                                    renderItem={({ active, ...props }) => (
                                        <StyledProjectListItemCompact
                                            key={item.id}
                                            id={item.id}
                                            title={item.title}
                                            owner={item.activity}
                                            focused={active}
                                            {...props}
                                        />
                                    )}
                                />
                            ))}
                        </Table>
                    </>
                ))}
            </ListView>
        </TaskanyGlobalSearch>
    );
};
