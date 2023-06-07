/* eslint-disable no-nested-ternary */
import React, { useState, ChangeEvent, useCallback, useMemo, useRef } from 'react';
import styled from 'styled-components';
import { ComboBox, Input, SearchIcon, Text } from '@taskany/bricks';
import { gray7, textColor } from '@taskany/colors';

import { trpc } from '../../utils/trpcClient';
import { useRouter } from '../../hooks/router';
import { useHotkey } from '../../hooks/useHotkeys';
import { Keyboard } from '../Keyboard';
import { GoalListItemCompact } from '../GoalListItemCompact';
import { ProjectListItemCompact } from '../ProjectListItemCompact';
import { Table } from '../Table';

import { tr } from './GlobalSearch.i18n';

const StyledInput = styled(Input)`
    min-width: 200px;
    display: inline-block;
`;

const StyledSearchIcon = styled(SearchIcon)`
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

const StyledResultsTable = styled(Table)`
    grid-template-columns: 1fr minmax(300px, 30%) repeat(4, max-content) 1fr;
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
        (item: ItemsType[number]) => {
            setQuery('');
            router[item.__kind](item.__urlParams);
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
            renderItems={(children) => (
                <StyledResultsTable columns={6}>{children as React.ReactNode}</StyledResultsTable>
            )}
            renderItem={(props) => {
                switch (props.item.__kind) {
                    case ItemType.goal:
                        return (
                            <GoalListItemCompact
                                key={props.item.id}
                                shortId={props.item._shortId}
                                projectId={props.item.projectId}
                                title={props.item.title}
                                state={props.item.state}
                                issuer={props.item.activity}
                                owner={props.item.owner}
                                priority={props.item.priority}
                                estimate={props.item._lastEstimate}
                                focused={props.index === props.cursor}
                                onClick={props.onClick}
                            />
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
