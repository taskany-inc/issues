import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';

import { gray6, gray7, gray8, radiusM } from '../design/@generated/themes';
import { createFetcher } from '../utils/createFetcher';
import { Dependency } from '../../graphql/@generated/genql';
import { useKeyPress } from '../hooks/useKeyPress';
import { useKeyboard, KeyCode } from '../hooks/useKeyboard';
import { nullable } from '../utils/nullable';

import { Button } from './Button';
import { Popup } from './Popup';

interface IssueDependencyKindDropdownProps {
    size?: React.ComponentProps<typeof Button>['size'];
    view?: React.ComponentProps<typeof Button>['view'];
    disabled?: React.ComponentProps<typeof Button>['disabled'];
    tabIndex?: React.ComponentProps<typeof Button>['tabIndex'];
    text: React.ComponentProps<typeof Button>['text'];

    onClick?: (dependency: Dependency) => void;
}

const StyledCard = styled.div<{ focused?: boolean }>`
    box-sizing: border-box;
    justify-content: center;
    align-items: center;

    padding: 6px;
    margin-bottom: 4px;

    border: 1px solid ${gray7};
    border-radius: ${radiusM};

    font-size: 13px;

    cursor: pointer;

    &:last-child {
        margin-bottom: 0;
    }

    &:hover {
        border-color: ${gray8};
        background-color: ${gray6};
    }

    ${({ focused }) =>
        focused &&
        css`
            border-color: ${gray8};
            background-color: ${gray6};
        `}
`;

const StyledDropdownContainer = styled.div``;

const fetcher = createFetcher(() => ({
    goalDependencyKind: true,
}));

export const IssueDependencyKindDropdown: React.FC<IssueDependencyKindDropdownProps> = ({
    size = 'm',
    text,
    view,
    tabIndex,
    disabled,
    onClick,
}) => {
    const t = useTranslations('IssueDependencies');
    const { data: session } = useSession();
    const popupRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [popupVisible, setPopupVisibility] = useState(false);
    const downPress = useKeyPress('ArrowDown');
    const upPress = useKeyPress('ArrowUp');
    const [cursor, setCursor] = useState(0);

    const onClickOutside = useCallback(() => {
        setPopupVisibility(false);
    }, []);

    const onButtonClick = useCallback(() => {
        setPopupVisibility(true);
    }, []);

    const { data } = useSWR('goalDependencyKind', () => fetcher(session?.user));

    const onCardClick = useCallback(
        (dependency?: Dependency) => () => {
            setPopupVisibility(false);
            dependency && onClick && onClick(dependency);
        },
        [onClick],
    );

    const [onESC] = useKeyboard(
        [KeyCode.Escape],
        () => {
            popupVisible && setPopupVisibility(false);
        },
        {
            stopPropagation: true,
        },
    );

    const [onENTER] = useKeyboard(
        [KeyCode.Enter],
        () => {
            if (data?.goalDependencyKind?.length) {
                onCardClick(data?.goalDependencyKind[cursor] as Dependency)();
                popupRef.current?.focus();
            }
        },
        {
            stopPropagation: true,
        },
    );

    useEffect(() => {
        const goalDependencyKind = data?.goalDependencyKind;

        if (goalDependencyKind?.length && downPress) {
            setCursor((prevState) => (prevState < goalDependencyKind.length - 1 ? prevState + 1 : prevState));
        }
    }, [data?.goalDependencyKind, downPress]);

    useEffect(() => {
        if (data?.goalDependencyKind?.length && upPress) {
            setCursor((prevState) => (prevState > 0 ? prevState - 1 : prevState));
        }
    }, [data?.goalDependencyKind, upPress]);

    return (
        <>
            <StyledDropdownContainer ref={popupRef} {...onESC}>
                <Button
                    ref={buttonRef}
                    size={size}
                    view={view}
                    text={text}
                    title={text}
                    disabled={disabled}
                    onClick={onButtonClick}
                    tabIndex={tabIndex}
                />
            </StyledDropdownContainer>

            <Popup
                placement="top-start"
                overflow="hidden"
                visible={popupVisible && Boolean(data?.goalDependencyKind?.length)}
                onClickOutside={onClickOutside}
                reference={popupRef}
                interactive
                minWidth={150}
                maxWidth={250}
                offset={[0, 4]}
            >
                <div {...onENTER}>
                    {data?.goalDependencyKind?.map((d, i) =>
                        nullable(d, (dep) => (
                            <StyledCard key={d} focused={cursor === i} onClick={onCardClick(dep as Dependency)}>
                                {t(dep)}
                            </StyledCard>
                        )),
                    )}
                </div>
            </Popup>
        </>
    );
};
