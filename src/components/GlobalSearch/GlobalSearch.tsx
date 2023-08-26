/* eslint-disable no-nested-ternary */
import React, { useState, ChangeEvent, useCallback, useMemo, useRef } from 'react';
import NextLink from 'next/link';
import styled from 'styled-components';
import { ComboBox, Input, Text, Table } from '@taskany/bricks';
import { gapS, gapXs, gray7, radiusM, textColor } from '@taskany/colors';
import { IconSearchOutline } from '@taskany/icons';

import { trpc } from '../../utils/trpcClient';
import { routes, useRouter } from '../../hooks/router';
import { useHotkey } from '../../hooks/useHotkeys';
import { Keyboard } from '../Keyboard';
import { GoalListItemCompact } from '../GoalListItemCompact';
import { ProjectListItemCompact } from '../ProjectListItemCompact';

import { tr } from './GlobalSearch.i18n';

const StyledInput = styled(Input)`
    min-width: 200px;
    display: inline-block;
`;

const StyledSearchIcon = styled(IconSearchOutline)`
    position: relative;
    top: 2px;
`;

const StyledTrigger = styled(StyledSearchIcon)`
    margin-left: 9px; // input iconLeft padding, size=m

    transition: color 200ms cubic-bezier(0.3, 0, 0.5, 1);

    &:hover {
        color: ${textColor};
    }
`;

const StyledRow = styled(GoalListItemCompact)`
    padding: ${gapXs} ${gapS};
    border-radius: ${radiusM};
    cursor: pointer;
`;

enum ItemType {
    goal = 'goal',
    project = 'project',
}

export const GlobalSearch = React.forwardRef<HTMLDivElement>((_, ref) => {
    const triggerRef = useRef<HTMLSpanElement | null>(null);
    const [query, setQuery] = useState('');
    const router = useRouter();

    useHotkey('/', () => {
        setTimeout(() => {
            triggerRef.current?.click();
        }, 0);
    });

    const suggestions = trpc.search.global.useQuery(query, {
        enabled: query.length >= 3,
        cacheTime: 0,
        staleTime: 0,
    });

    const items = useMemo(() => {
        return [
            ...(suggestions.data?.goals || []).map((g) => ({
                ...g,
                __kind: ItemType.goal,
                __urlParams: g._shortId,
            })),
            ...(suggestions.data?.projects || []).map((p) => ({
                ...p,
                __kind: ItemType.project,
                __urlParams: p.id,
            })),
        ];
    }, [suggestions.data]);
    type ItemsType = typeof items;

    const onClickOutside = useCallback((cb: () => void) => {
        cb();
    }, []);

    const onClose = useCallback(() => {
        setQuery('');
    }, [setQuery]);

    const onQueryChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setQuery(e.currentTarget.value);
    }, []);

    const onSearchChange = useCallback(
        (item?: ItemsType[number]) => {
            if (item) {
                setQuery('');
                router[item.__kind](item.__urlParams);
            }
        },
        [router],
    );

    return (
        <ComboBox
            ref={ref}
            maxWidth={800}
            onChange={onSearchChange}
            onClose={onClose}
            onClickOutside={onClickOutside}
            items={items}
            renderTrigger={(props) => <StyledTrigger ref={triggerRef} size="s" color={gray7} onClick={props.onClick} />}
            renderInput={(props) => (
                <StyledInput
                    autoFocus
                    disabled={props.disabled}
                    placeholder={tr('Search or jump to...')}
                    onChange={onQueryChange}
                    iconLeft={<StyledSearchIcon size="s" color={textColor} />}
                    iconRight={
                        <Text size="xs">
                            <Keyboard size="s">/</Keyboard>
                        </Text>
                    }
                    {...props}
                />
            )}
            renderItems={(children) => <Table width={700}>{children as React.ReactNode}</Table>}
            renderItem={(props) => {
                switch (props.item.__kind) {
                    case ItemType.goal:
                        return (
                            <NextLink
                                key={props.item.id}
                                passHref
                                href={routes.goal(props.item._shortId)}
                                legacyBehavior
                            >
                                <StyledRow
                                    forwardedAs="a"
                                    focused={props.index === props.cursor}
                                    align="center"
                                    gap={10}
                                    onClick={props.onClick}
                                    item={{
                                        title: props.item.title,
                                        priority: props.item.priority,
                                        state: props.item.state,
                                        owner: props.item.owner,
                                        issuer: props.item.activity,
                                        estimate: props.item._lastEstimate,
                                        projectId: props.item.projectId,
                                    }}
                                    columns={[
                                        { name: 'title', columnProps: { col: 3 } },
                                        { name: 'state', columnProps: { col: 1, justify: 'end' } },
                                        { name: 'priority', columnProps: { width: '12ch' } },
                                        { name: 'projectId', columnProps: { col: 3 } },
                                        { name: 'issuers' },
                                        { name: 'estimate', columnProps: { width: '8ch' } },
                                    ]}
                                />
                            </NextLink>
                        );

                    case ItemType.project:
                        return (
                            <ProjectListItemCompact
                                key={props.item.id}
                                id={props.item.id}
                                title={props.item.title}
                                owner={props.item.activity}
                                focused={props.index === props.cursor}
                                onClick={props.onClick}
                            />
                        );
                    default:
                        break;
                }
            }}
        />
    );
});
