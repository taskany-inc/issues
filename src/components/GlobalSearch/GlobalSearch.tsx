/* eslint-disable no-nested-ternary */
import React, { useState, ChangeEvent, useCallback, useRef, useEffect, HTMLAttributes } from 'react';
import styled from 'styled-components';
import {
    Input,
    Text,
    Popup,
    useKeyboard,
    KeyCode,
    useClickOutside,
    nullable,
    ListView,
    ListViewItem,
} from '@taskany/bricks';
import { IconTargetOutline, IconUsersOutline, IconSearchOutline } from '@taskany/icons';
import { gapS, gapXs, gray4, textColor } from '@taskany/colors';

import { trpc } from '../../utils/trpcClient';
import { routes, useRouter } from '../../hooks/router';
import { useHotkey } from '../../hooks/useHotkeys';
import { Keyboard } from '../Keyboard';
import { ProjectListItem } from '../ProjectListItem';
import { GoalListItem } from '../GoalListItem';
import { NextLink } from '../NextLink';

import { tr } from './GlobalSearch.i18n';

type ListViewItemValue = ['goal' | 'project', string];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const StyledInput = styled(({ focused, ...props }) => <Input {...props} />)<{ focused?: boolean }>`
    display: inline-block;
    min-width: 200px;

    transition: min-width 100ms ease-in-out;

    ${({ focused }) =>
        focused &&
        `
        position: absolute;
        z-index: 99991; // 9999 — Popup z-index

        min-width: 400px;
    `}
`;

const StyledResults = styled.div`
    padding: 36px ${gapS} ${gapS} ${gapS};
    min-width: 700px;
`;

const StyledSearchIcon = styled(IconSearchOutline)<{ focused?: boolean }>`
    position: relative;
    top: 2px;

    ${({ focused }) =>
        focused &&
        `
            z-index: 99992; // 99991 — Input z-index
        `}
`;

const StyledGlobalSearch = styled.div`
    position: relative;
`;

const StyledGroupHeader = styled(Text)`
    display: flex;
    align-items: center;
    justify-content: space-between;

    box-sizing: border-box;

    padding-top: ${gapS};
    padding-bottom: ${gapXs};

    max-width: 392px;

    border-bottom: 1px solid ${gray4};
`;

const StyledPopupSurface = styled.div<{ visible?: boolean }>`
    position: fixed;
    z-index: 101;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;

    display: flex;
    justify-content: center;
    align-items: center;

    width: 100%;
    height: 100%;

    background-color: transparent;
    transition: background-color 100ms ease-in-out;

    ${({ visible }) =>
        visible &&
        `
        background-color: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(5px);
    `}
`;

export const GlobalSearch: React.FC<HTMLAttributes<HTMLDivElement>> = (attrs) => {
    const popupContentRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [query, setQuery] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [popupVisible, setPopupVisible] = useState(false);
    const surfaceVisible = useRef(false);
    const router = useRouter();

    const inputHardFocus = useCallback(() => {
        setTimeout(() => {
            inputRef.current?.focus();
            setQuery('');
        }, 0);
    }, []);

    useHotkey('/', inputHardFocus);

    const suggestions = trpc.search.global.useQuery(query, {
        enabled: query.length >= 3,
        cacheTime: 0,
        staleTime: 0,
    });

    const onKeyboardNavigate = useCallback(
        ([entity, id]: ListViewItemValue) => {
            setEditMode(false);
            setQuery('');

            router[entity](id);
        },
        [router],
    );

    useEffect(() => {
        const resultsExists = Boolean(suggestions.data?.goals?.length || suggestions.data?.projects.length);
        setPopupVisible(resultsExists);
        setTimeout(() => {
            popupContentRef.current?.focus();
        }, 0);
        if (resultsExists && !surfaceVisible.current) surfaceVisible.current = true;
    }, [suggestions.data]);

    const [onESC] = useKeyboard([KeyCode.Escape], () => {
        if (query === '') {
            setEditMode(false);
            inputRef.current?.blur();
        } else {
            setQuery('');
        }

        surfaceVisible.current = false;
    });

    useClickOutside(inputRef, (e) => {
        if (!popupContentRef.current?.contains(e.target as Node)) {
            setEditMode(false);
            setQuery('');
        }
    });

    const onQueryChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        if (e.currentTarget.value === '') {
            surfaceVisible.current = false;
        }

        setQuery(e.currentTarget.value);
    }, []);

    return (
        <>
            {nullable(editMode, () => (
                <StyledPopupSurface visible={surfaceVisible.current} />
            ))}
            <StyledGlobalSearch>
                <StyledInput
                    forwardRef={inputRef}
                    focused={editMode}
                    placeholder={tr('Search or jump to...')}
                    iconLeft={<StyledSearchIcon focused={editMode} size="s" color={textColor} />}
                    iconRight={nullable(!editMode, () => (
                        <Text size="xs" onClick={inputHardFocus}>
                            <Keyboard size="s">/</Keyboard>
                        </Text>
                    ))}
                    value={query}
                    onChange={onQueryChange}
                    onFocus={() => setEditMode(true)}
                    {...onESC}
                />

                <Popup
                    placement="bottom-start"
                    visible={popupVisible}
                    reference={inputRef}
                    interactive
                    minWidth={400}
                    maxWidth={800}
                    offset={[-4, -36]}
                    {...attrs}
                >
                    <StyledResults ref={popupContentRef} {...onESC}>
                        <ListView onKeyboardClick={onKeyboardNavigate}>
                            {nullable(suggestions.data?.goals, (goals) => (
                                <>
                                    <StyledGroupHeader size="m" weight="bolder">
                                        {tr('Goals')} <IconTargetOutline size="s" />
                                    </StyledGroupHeader>
                                    {goals.map((item) => {
                                        const value: ListViewItemValue = ['goal', item._shortId];

                                        return (
                                            <ListViewItem
                                                key={item.id}
                                                value={value}
                                                renderItem={({ active, ...props }) => (
                                                    <NextLink href={routes.goal(item._shortId)}>
                                                        <GoalListItem
                                                            focused={active}
                                                            title={item.title}
                                                            priority={item.priority}
                                                            state={item.state}
                                                            owner={item.owner}
                                                            issuer={item.activity}
                                                            estimate={item._lastEstimate}
                                                            projectId={item.projectId}
                                                            {...props}
                                                        />
                                                    </NextLink>
                                                )}
                                            />
                                        );
                                    })}
                                </>
                            ))}
                            {nullable(suggestions.data?.projects, (projects) => (
                                <>
                                    <StyledGroupHeader size="m" weight="bolder">
                                        {tr('Projects')} <IconUsersOutline size="s" />
                                    </StyledGroupHeader>
                                    {projects.map((item) => (
                                        <ListViewItem
                                            key={item.id}
                                            value={['project', item.id]}
                                            renderItem={({ active, ...props }) => (
                                                <NextLink href={routes.project(item.id)}>
                                                    <ProjectListItem
                                                        key={item.id}
                                                        id={item.id}
                                                        size="m"
                                                        title={item.title}
                                                        owner={item.activity}
                                                        focused={active}
                                                        childrenCount={item._count.children}
                                                        {...props}
                                                    />
                                                </NextLink>
                                            )}
                                        />
                                    ))}
                                </>
                            ))}
                        </ListView>
                    </StyledResults>
                </Popup>
            </StyledGlobalSearch>
        </>
    );
};
