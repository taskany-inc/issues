import React, { useState, useCallback } from 'react';
import NextLink from 'next/link';
import { nullable } from '@taskany/bricks';
import {
    ListView,
    ListViewItem,
    GlobalSearch as TaskanyGlobalSearch,
    MenuItem,
    Link,
    Text,
    Table,
} from '@taskany/bricks/harmony';
import { IconTargetOutline, IconUsersOutline } from '@taskany/icons';

import { trpc } from '../../utils/trpcClient';
import { routes, useRouter } from '../../hooks/router';
import { GoalListItemCompact } from '../GoalListItemCompact/GoalListItemCompact';
import { ProjectListItemCompact } from '../ProjectListItemCompact/ProjectListItemCompact';

import { tr } from './GlobalSearch.i18n';
import s from './GlobalSearch.module.css';

type ListViewItemValue = ['goal' | 'project', string];

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
    const nothingFound = Boolean(!resultsExists && query.length);

    return (
        <TaskanyGlobalSearch
            value={query}
            onChange={setQuery}
            searchResultExists={resultsExists || nothingFound}
            placeholder={tr('Search...')}
            placement="bottom-end"
            offset={[8, -40]}
            outline
        >
            {nullable(resultsExists, () => (
                <ListView onKeyboardClick={onKeyboardNavigate}>
                    {nullable(suggestions.data?.goals?.length, () => (
                        <>
                            <Text size="m" weight="bolder" className={s.GroupHeader}>
                                {tr('Goals')} <IconTargetOutline size="s" />
                            </Text>
                            <Table className={s.GlobalSearchTable}>
                                {suggestions.data?.goals.map((item) => {
                                    const value: ListViewItemValue = ['goal', item._shortId];

                                    return (
                                        <ListViewItem
                                            key={item.id}
                                            value={value}
                                            renderItem={({ active, hovered, ...props }) => (
                                                <NextLink passHref href={routes.goal(item._shortId)} legacyBehavior>
                                                    <Link>
                                                        <MenuItem {...props} hovered={active || hovered}>
                                                            <GoalListItemCompact
                                                                item={item}
                                                                columns={[
                                                                    {
                                                                        name: 'title',
                                                                        columnProps: { width: '32%' },
                                                                    },
                                                                    {
                                                                        name: 'state',
                                                                    },
                                                                    {
                                                                        name: 'priority',
                                                                        columnProps: { width: '19%' },
                                                                    },
                                                                    {
                                                                        name: 'projectId',
                                                                        columnProps: { width: '25%' },
                                                                    },
                                                                    { name: 'issuers' },
                                                                    {
                                                                        name: 'estimate',
                                                                        columnProps: {
                                                                            width: '8ch',
                                                                            justify: 'end',
                                                                        },
                                                                    },
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
                            <Table className={s.GlobalSearchTable}>
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
            ))}
            {nullable(nothingFound, () => (
                <Text size="m" weight="bolder" className={`${s.GroupHeader} ${s.NothingFound}`}>
                    {tr('Nothing found')}
                </Text>
            ))}
        </TaskanyGlobalSearch>
    );
};
