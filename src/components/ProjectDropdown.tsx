import React, { useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { Input, useInput, useKeyboard, KeyCode } from '@geist-ui/core';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';

import { Button } from './Button';
import { Popup } from './Popup';
import { Icon } from './Icon';
import {
    buttonBackgroundColorHover,
    buttonBorderColor,
    buttonBorderColorHover,
    buttonIconColor,
} from '../design/@generated/themes';
import { createFetcher } from '../utils/createFetcher';
import { Project } from '../../graphql/generated/genql';
import { useKeyPress } from '../hooks/useKeyPress';

interface ProjectDropdownProps {
    size?: React.ComponentProps<typeof Button>['size'];
    view?: React.ComponentProps<typeof Button>['view'];
    text: React.ComponentProps<typeof Button>['text'];
    query?: string;
    placeholder?: string;
    onProjectClick?: (project: Project) => void;
}

const StyledProjectCard = styled.div<{ focused?: boolean }>`
    padding: 6px;
    border: 1px solid ${buttonBorderColor};
    border-radius: 6px;
    min-width: 250px;
    margin-bottom: 4px;
    cursor: pointer;

    &:last-child {
        margin-bottom: 0;
    }

    &:hover {
        border-color: ${buttonBorderColorHover};
        background-color: ${buttonBackgroundColorHover};
    }

    ${({ focused }) =>
        focused &&
        css`
            border-color: ${buttonBorderColorHover};
            background-color: ${buttonBackgroundColorHover};
        `}
`;
const StyledProjectInfo = styled.div`
    padding-left: 4px;
`;
const StyledProjectTitle = styled.div`
    font-size: 14px;
    font-weight: 600;
`;
const ProjectCard: React.FC<{ title?: string; focused?: boolean; onClick?: () => void }> = ({
    title,
    focused,
    onClick,
}) => {
    return (
        <StyledProjectCard onClick={onClick} focused={focused}>
            <StyledProjectInfo>
                <StyledProjectTitle>{title}</StyledProjectTitle>
            </StyledProjectInfo>
        </StyledProjectCard>
    );
};

const StyledDropdownContainer = styled.div``;

const fetcher = createFetcher((_, query: string) => ({
    projectsCompletion: [
        {
            query,
        },
        {
            id: true,
            slug: true,
            title: true,
            description: true,
        },
    ],
}));

export const ProjectDropdown: React.FC<ProjectDropdownProps> = ({
    size,
    text,
    view,
    onProjectClick,
    query = '',
    placeholder,
}) => {
    const { data: session } = useSession();
    const popupRef = useRef<any>();
    const buttonRef = useRef<any>();
    const [popupVisible, setPopupVisibility] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const { state: inputState, setState: setInputState, reset: inputReset, bindings: onInput } = useInput(query);
    const downPress = useKeyPress('ArrowDown');
    const upPress = useKeyPress('ArrowUp');
    const [cursor, setCursor] = useState(0);

    const onClickOutside = () => {
        setEditMode(false);
        setPopupVisibility(false);
        inputReset();
    };

    const onButtonClick = () => {
        setEditMode(true);
        setPopupVisibility(true);
    };

    const onInputBlur = () => {};

    const { data } = useSWR(inputState, (query) => fetcher(session?.user, query));

    const { bindings: onESC } = useKeyboard(
        () => {
            popupVisible && setPopupVisibility(false);
            setEditMode(false);
        },
        [KeyCode.Escape],
        {
            stopPropagation: true,
        },
    );

    const { bindings: onENTER } = useKeyboard(
        () => {
            if (data?.projectsCompletion?.length) {
                onProjectCardClick(data?.projectsCompletion[cursor] as Project)();
                popupRef.current?.focus();
            }
        },
        [KeyCode.Enter],
        {
            stopPropagation: true,
        },
    );

    const onProjectCardClick = (project: Project) => () => {
        setEditMode(false);
        setPopupVisibility(false);
        onProjectClick && onProjectClick(project);
        setInputState(project.title || '');
    };

    useEffect(() => {
        if (data?.projectsCompletion?.length && downPress) {
            setCursor((prevState) => (prevState < data?.projectsCompletion?.length! - 1 ? prevState + 1 : prevState));
        }
    }, [data?.projectsCompletion, downPress]);

    useEffect(() => {
        if (data?.projectsCompletion?.length && upPress) {
            setCursor((prevState) => (prevState > 0 ? prevState - 1 : prevState));
        }
    }, [data?.projectsCompletion, upPress]);

    return (
        <>
            <StyledDropdownContainer ref={popupRef} {...onESC}>
                {editMode ? (
                    <Input
                        placeholder={placeholder}
                        scale={0.78}
                        autoFocus
                        onBlur={onInputBlur}
                        {...onInput}
                        {...onENTER}
                    />
                ) : (
                    <Button
                        ghost
                        ref={buttonRef}
                        size={size}
                        view={view}
                        text={text}
                        iconLeft={<Icon type="location" size="xs" color={buttonIconColor} />}
                        onClick={onButtonClick}
                    />
                )}
            </StyledDropdownContainer>

            <Popup
                placement="top-start"
                overflow="hidden"
                visible={popupVisible && Boolean(data?.projectsCompletion?.length)}
                onClickOutside={onClickOutside}
                reference={popupRef}
                interactive
                minWidth={150}
                maxWidth={250}
                offset={[0, 4]}
            >
                <>
                    {data?.projectsCompletion?.map((p, i) => (
                        <ProjectCard
                            key={p.id}
                            title={p.title}
                            focused={cursor === i}
                            onClick={onProjectCardClick(p as Project)}
                        />
                    ))}
                </>
            </Popup>
        </>
    );
};
