/* eslint-disable no-nested-ternary */
import React, { useState, ChangeEvent, useCallback, useRef, useEffect, HTMLAttributes } from 'react';
import styled from 'styled-components';
import NextLink from 'next/link';
import {
    Input,
    Text,
    Table,
    Popup,
    useKeyboard,
    KeyCode,
    useClickOutside,
    nullable,
    ListView,
    ListViewItem,
} from '@taskany/bricks';
import { IconTargetOutline, IconUsersOutline, IconSearchOutline } from '@taskany/icons';
import { gapS, gapXs, gray4, radiusM, textColor } from '@taskany/colors';

import { trpc } from '../../utils/trpcClient';
import { routes, useRouter } from '../../hooks/router';
import { useHotkey } from '../../hooks/useHotkeys';
import { Keyboard } from '../Keyboard';
import { GoalListItemCompact } from '../GoalListItemCompact';
import { ProjectListItemCompact } from '../ProjectListItemCompact';

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
    padding-top: 36px; // Popup default offset + Input height 28px
    padding-bottom: ${gapS};
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
    margin: 0 ${gapS};

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

const tableWidth = 700;

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
                                                        <NextLink
                                                            passHref
                                                            href={routes.goal(item._shortId)}
                                                            legacyBehavior
                                                        >
                                                            <StyledGoalListItemCompact
                                                                focused={active}
                                                                align="center"
                                                                gap={10}
                                                                item={{
                                                                    title: item.title,
                                                                    priority: item.priority,
                                                                    state: item.state,
                                                                    owner: item.owner,
                                                                    issuer: item.activity,
                                                                    estimate: item._lastEstimate,
                                                                    projectId: item.projectId,
                                                                }}
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
                    </StyledResults>
                </Popup>
            </StyledGlobalSearch>
        </>
    );
};
