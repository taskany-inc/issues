import React, { useState, useCallback } from 'react';
import NextLink from 'next/link';
import { Table, nullable, ListView, ListViewItem } from '@taskany/bricks';
import { GlobalSearch as TaskanyGlobalSearch, MenuItem, Link, Text } from '@taskany/bricks/harmony';
import { IconTargetOutline, IconUsersOutline } from '@taskany/icons';

import { trpc } from '../../utils/trpcClient';
import { routes, useRouter } from '../../hooks/router';
import { GoalListItemCompact } from '../GoalListItemCompact';
import { ProjectListItemCompact } from '../ProjectListItemCompact';

import { tr } from './GlobalSearch.i18n';
import s from './GlobalSearch.module.css';

type ListViewItemValue = ['goal' | 'project', string];

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
            value={query}
            onChange={setQuery}
            searchResultExists={resultsExists}
            placeholder={tr('Search...')}
            outline
        >
            {resultsExists && (
                <ListView onKeyboardClick={onKeyboardNavigate}>
                    {nullable(suggestions.data?.goals?.length, () => (
                        <>
                            <Text size="m" weight="bolder" className={s.GroupHeader}>
                                {tr('Goals')} <IconTargetOutline size="s" />
                            </Text>
                            <Table width={tableWidth}>
                                {suggestions.data?.goals.map((item) => {
                                    const value: ListViewItemValue = ['goal', item._shortId];

                                    return (
                                        <ListViewItem
                                            key={item.id}
                                            value={value}
                                            renderItem={({ active, ...props }) => (
                                                <NextLink passHref href={routes.goal(item._shortId)} legacyBehavior>
                                                    <Link>
                                                        <MenuItem {...props} hovered={active}>
                                                            <GoalListItemCompact
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
                                                            />
                                                        </MenuItem>
                                                    </Link>
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
                            <Text size="m" weight="bolder" className={s.GroupHeader}>
                                {tr('Projects')} <IconUsersOutline size="s" />
                            </Text>
                            <Table width={tableWidth}>
                                {suggestions.data?.projects?.map((item) => (
                                    <ListViewItem
                                        key={item.id}
                                        value={['project', item.id]}
                                        renderItem={({ active, ...props }) => (
                                            <MenuItem {...props} hovered={active}>
                                                <ProjectListItemCompact
                                                    id={item.id}
                                                    title={item.title}
                                                    owner={item.activity}
                                                />
                                            </MenuItem>
                                        )}
                                    />
                                ))}
                            </Table>
                        </>
                    ))}
                </ListView>
            )}
        </TaskanyGlobalSearch>
    );
};
