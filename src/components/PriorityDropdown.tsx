import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import styled, { css } from 'styled-components';

import { createFetcher } from '../utils/createFetcher';
import { Priority } from '../../graphql/@generated/genql';
import { useKeyPress } from '../hooks/useKeyPress';
import { useKeyboard, KeyCode } from '../hooks/useKeyboard';
import { gapS, gapXs, gray4, radiusM } from '../design/@generated/themes';

import { Button } from './Button';
import { Popup } from './Popup';
import { Text } from './Text';

interface PriorityDropdownProps {
    text: React.ComponentProps<typeof Button>['text'];
    size?: React.ComponentProps<typeof Button>['size'];
    view?: React.ComponentProps<typeof Button>['view'];
    disabled?: React.ComponentProps<typeof Button>['disabled'];
    priority?: string;

    onClick?: (priority: Priority) => void;
}

const fetcher = createFetcher(() => ({
    goalPriorityKind: true,
}));

const StyledPriorityCard = styled.div<{ focused?: boolean }>`
    box-sizing: border-box;
    padding: ${gapXs} ${gapS};
    margin-bottom: ${gapS};
    min-width: 200px;

    border-radius: ${radiusM};

    cursor: pointer;

    &:last-child {
        margin-bottom: 0;
    }

    &:hover {
        background-color: ${gray4};
    }

    ${({ focused }) =>
        focused &&
        css`
            background-color: ${gray4};
        `}
`;

const PriorityCard: React.FC<{ title?: string; focused?: boolean; onClick?: () => void }> = ({
    title,
    focused,
    onClick,
}) => {
    return (
        <StyledPriorityCard onClick={onClick} focused={focused}>
            <Text size="s" weight="bold">
                {title}
            </Text>
        </StyledPriorityCard>
    );
};

export const PriorityDropdown: React.FC<PriorityDropdownProps> = ({
    size,
    text,
    priority,
    view,
    disabled,
    onClick,
}) => {
    const { data: session } = useSession();
    const popupRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [popupVisible, setPopupVisibility] = useState(false);
    const downPress = useKeyPress('ArrowDown');
    const upPress = useKeyPress('ArrowUp');
    const [cursor, setCursor] = useState<number>();
    const { data } = useSWR('priority', () => fetcher(session?.user));

    const onClickOutside = useCallback(() => {
        setPopupVisibility(false);
    }, []);

    const onButtonClick = useCallback(() => {
        setPopupVisibility(true);
    }, []);

    const onItemClick = useCallback(
        (p: Priority) => () => {
            setPopupVisibility(false);
            onClick && onClick(p);
        },
        [onClick],
    );

    const [onESC] = useKeyboard([KeyCode.Escape], () => popupVisible && setPopupVisibility(false));

    const [onENTER] = useKeyboard([KeyCode.Enter], () => {
        if (data?.goalPriorityKind?.length && cursor) {
            const currPosition = data?.goalPriorityKind[cursor] as Priority;
            if (currPosition) {
                onItemClick(currPosition)();
                setPopupVisibility(false);
            }
        }
    });

    useEffect(() => {
        const priority = data?.goalPriorityKind;

        if (priority?.length && downPress) {
            setCursor((prevState = 0) => (prevState < priority.length - 1 ? prevState + 1 : prevState));
        }
    }, [data?.goalPriorityKind, downPress]);

    useEffect(() => {
        if (data?.flow?.states?.length && upPress) {
            setCursor((prevState = 0) => (prevState > 0 ? prevState - 1 : prevState));
        }
    }, [data?.flow, upPress]);

    useEffect(() => {
        if (data?.goalPriorityKind?.length && priority) {
            for (let currCursor = 0; currCursor < data?.goalPriorityKind?.length; currCursor++) {
                if (data?.goalPriorityKind[currCursor] === priority) {
                    setCursor(currCursor);
                    break;
                }
            }
        }
    }, [data?.goalPriorityKind, priority]);

    return (
        <>
            <span ref={popupRef} {...onESC} {...onENTER}>
                <Button
                    ref={buttonRef}
                    disabled={disabled}
                    size={size}
                    view={view}
                    text={text}
                    onClick={onButtonClick}
                />
            </span>

            <Popup
                placement="top-start"
                overflow="hidden"
                visible={popupVisible && Boolean(data?.goalPriorityKind?.length)}
                onClickOutside={onClickOutside}
                reference={popupRef}
                interactive
                minWidth={150}
                maxWidth={250}
                offset={[0, 4]}
            >
                <>
                    {data?.goalPriorityKind?.map((p, i) => (
                        <PriorityCard
                            key={p}
                            title={p}
                            focused={p === priority || cursor === i}
                            onClick={onItemClick(p as Priority)}
                        />
                    ))}
                </>
            </Popup>
        </>
    );
};
