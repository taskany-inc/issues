import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';

import { gapXs, gray4, gray7, gray8, radiusM } from '../design/@generated/themes';
import { createFetcher } from '../utils/createFetcher';
import { Goal } from '../../graphql/@generated/genql';
import { useKeyPress } from '../hooks/useKeyPress';
import { useKeyboard, KeyCode } from '../hooks/useKeyboard';

import { Text } from './Text';
import { Popup } from './Popup';
import { FormInput } from './FormInput';
import { IssueKey } from './IssueKey';

interface IssueSearchInputProps {
    query?: string;
    placeholder?: string;
    filter?: string[];
    title?: string;

    onClick?: (issue: Goal) => void;
}

const StyledIssueCard = styled.div<{ focused?: boolean }>`
    box-sizing: border-box;
    justify-content: center;
    align-items: center;
    min-width: 250px;

    padding: 6px;
    margin-bottom: 4px;

    border: 1px solid ${gray7};
    border-radius: ${radiusM};

    cursor: pointer;

    &:last-child {
        margin-bottom: 0;
    }

    &:hover {
        border-color: ${gray8};
        background-color: ${gray4};
    }

    ${({ focused }) =>
        focused &&
        css`
            border-color: ${gray8};
            background-color: ${gray4};
        `}
`;

const StyledIssueTitleText = styled(Text)`
    padding-top: ${gapXs};
`;

const IssueCard: React.FC<{
    id: string;
    title?: string;
    project?: boolean;
    focused?: boolean;
    onClick?: () => void;
}> = ({ id, title, focused, onClick }) => {
    return (
        <StyledIssueCard onClick={onClick} focused={focused}>
            <IssueKey id={id} size="xs" />
            <StyledIssueTitleText size="m" weight="bold">
                {title}
            </StyledIssueTitleText>
        </StyledIssueCard>
    );
};

const StyledDropdownContainer = styled.div``;

const fetcher = createFetcher((_, query: string) => ({
    findGoal: [
        {
            query,
        },
        {
            id: true,
            title: true,
            description: true,
            activityId: true,
            ownerId: true,
            state: {
                id: true,
                title: true,
                hue: true,
            },
            estimate: {
                date: true,
                q: true,
                y: true,
            },
            createdAt: true,
            updatedAt: true,
            project: {
                id: true,
                key: true,
                title: true,
                description: true,
                flow: {
                    id: true,
                },
            },
            computedActivity: {
                id: true,
                name: true,
                email: true,
            },
            computedOwner: {
                id: true,
                name: true,
                email: true,
                image: true,
            },
            tags: {
                id: true,
                title: true,
                description: true,
            },
            watchers: {
                id: true,
            },
            stargizers: {
                id: true,
            },
            comments: {
                id: true,
            },
            participants: {
                id: true,
                user: {
                    email: true,
                    name: true,
                    image: true,
                },
                ghost: {
                    email: true,
                },
            },
        },
    ],
}));

export const IssueSearchInput: React.FC<IssueSearchInputProps> = ({ onClick, query = '', placeholder }) => {
    const { data: session } = useSession();
    const popupRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [popupVisible, setPopupVisibility] = useState(false);
    const [inputState, setInputState] = useState('');
    const downPress = useKeyPress('ArrowDown');
    const upPress = useKeyPress('ArrowUp');
    const [cursor, setCursor] = useState(0);

    useEffect(() => {
        setInputState(query);
    }, [query]);

    const onClickOutside = useCallback(() => {
        setPopupVisibility(false);
        setInputState(query);
    }, [query]);

    const { data } = useSWR(inputState, (q) => fetcher(session?.user, q));

    const onInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (data?.findGoal?.length) {
                setPopupVisibility(true);
            }

            setInputState(e.target.value);
        },
        [data?.findGoal],
    );

    const onIssueCardClick = useCallback(
        (issue: Goal) => () => {
            setPopupVisibility(false);
            onClick && onClick(issue);
        },
        [onClick],
    );

    const [onESC] = useKeyboard([KeyCode.Escape], () => {
        popupVisible && setPopupVisibility(false);
    });

    const [onENTER] = useKeyboard([KeyCode.Enter], () => {
        if (data?.findGoal?.length) {
            onIssueCardClick(data?.findGoal[cursor])();
            popupRef.current?.focus();
        }
    });

    useEffect(() => {
        const findGoal = data?.findGoal;

        if (findGoal?.length && downPress) {
            setCursor((prevState) => (prevState < findGoal.length - 1 ? prevState + 1 : prevState));
        }
    }, [data?.findGoal, downPress]);

    useEffect(() => {
        if (data?.findGoal?.length && upPress) {
            setCursor((prevState) => (prevState > 0 ? prevState - 1 : prevState));
        }
    }, [data?.findGoal, upPress]);

    return (
        <>
            <StyledDropdownContainer ref={popupRef} {...onESC}>
                <FormInput
                    ref={inputRef}
                    autoFocus
                    placeholder={placeholder}
                    value={inputState}
                    onChange={onInputChange}
                    {...onENTER}
                />
            </StyledDropdownContainer>

            <Popup
                placement="top-start"
                overflow="hidden"
                visible={popupVisible && Boolean(data?.findGoal?.length)}
                onClickOutside={onClickOutside}
                reference={popupRef}
                interactive
                minWidth={150}
                maxWidth={250}
                offset={[0, 4]}
            >
                <>
                    {data?.findGoal?.map((g, i) => (
                        <IssueCard
                            key={g.id}
                            id={g.id}
                            title={g.title}
                            focused={cursor === i}
                            onClick={onIssueCardClick(g)}
                        />
                    ))}
                </>
            </Popup>
        </>
    );
};
