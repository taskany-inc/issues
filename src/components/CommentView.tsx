import React, { FC, useCallback, useMemo, useState } from 'react';
import styled, { css } from 'styled-components';
import dynamic from 'next/dynamic';

import { Comment, Scalars, User } from '../../graphql/@generated/genql';
import { brandColor, gapM, gapS, gray4, textColorPrimary } from '../design/@generated/themes';
import { TLocale } from '../types/locale';
import { nullable } from '../utils/nullable';

import { Card, CardComment, CardInfo } from './Card';
import { Link } from './Link';
import { UserPic } from './UserPic';
import { Icon } from './Icon';
import { Reactions, ReactionsMap, reactionsGroupsLimit } from './Reactions';

const Md = dynamic(() => import('./Md'));
const RelativeTime = dynamic(() => import('./RelativeTime'));
const CommentEditForm = dynamic(() => import('./CommentEditForm'));
const ReactionsDropdown = dynamic(() => import('./ReactionsDropdown'));

interface CommentViewProps {
    id: string;
    description: string;
    createdAt: Scalars['DateTime'];
    locale: TLocale;
    reactions?: Comment['reactions'];
    updatedAt?: Scalars['DateTime'];
    author?: User;
    isNew?: boolean;
    isEditable?: boolean;

    onReactionToggle?: React.ComponentProps<typeof ReactionsDropdown>['onClick'];
}

export const commentMask = 'comment-';

const StyledCommentActions = styled.div`
    display: flex;
    align-items: center;
    justify-self: end;

    & > span {
        display: flex;
        align-self: center;
        transition: color 150ms ease-in-out;

        &:hover {
            color: ${textColorPrimary};
        }
    }

    & > span + span {
        margin-left: ${gapS};
    }
`;

const StyledComment = styled.div`
    display: grid;
    grid-template-columns: 35px 1fr;
    column-gap: 15px;
`;

const StyledCommentCard = styled(Card)<{ isNew?: boolean }>`
    position: relative;
    min-height: 60px;

    user-select: none;

    transition: border-color 200ms ease-in-out;

    ${({ isNew }) =>
        isNew &&
        css`
            border-color: ${brandColor};
        `}

    &::before {
        position: absolute;
        z-index: 0;

        content: '';

        width: 14px;
        height: 14px;

        background-color: ${gray4};

        border-left: 1px solid ${gray4};
        border-top: 1px solid ${gray4};
        border-radius: 2px;

        transform: rotate(-45deg);
        transition: border-color 200ms ease-in-out;

        top: 8px;
        left: -6px;

        ${({ isNew }) =>
            isNew &&
            css`
                border-color: ${brandColor};
            `}
    }
`;

const StyledCardInfo = styled(CardInfo)`
    display: grid;
    grid-template-columns: 6fr 6fr;
`;

const StyledReactions = styled.div`
    padding-top: ${gapM};
`;

export const CommentView: FC<CommentViewProps> = ({
    id,
    author,
    description,
    createdAt,
    isNew,
    isEditable,
    locale,
    reactions,
    onReactionToggle,
}) => {
    const [editMode, setEditMode] = useState(false);
    const [commentDescription, setCommentDescription] = useState(description);

    const onDoubleCommentClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (isEditable && e.detail === 2) {
                setTimeout(() => {
                    setEditMode(true);
                }, 100);
            }
        },
        [isEditable],
    );

    const onEdited = useCallback(
        (id?: string, description?: string) => {
            setEditMode(false);
            setCommentDescription(description || commentDescription);
        },
        [commentDescription],
    );

    const onChanged = useCallback((description: string) => {
        setCommentDescription(description);
    }, []);

    const grouppedReactions = useMemo(
        () =>
            reactions?.reduce((acc, curr) => {
                if (!curr) return acc;

                acc[curr.emoji] = acc[curr.emoji]
                    ? {
                          count: acc[curr.emoji].count + 1,
                          authors: acc[curr.emoji].authors.add(curr.activityId),
                      }
                    : {
                          count: 1,
                          authors: new Set(),
                      };

                return acc;
            }, {} as ReactionsMap),
        [reactions],
    );
    const reactionsGroupsNames = Object.keys(grouppedReactions || {});

    return (
        <StyledComment id={`${commentMask}${id}`}>
            <UserPic size={32} src={author?.image} email={author?.email} />

            {editMode ? (
                <CommentEditForm
                    id={id}
                    locale={locale}
                    description={commentDescription}
                    onCancel={onEdited}
                    onChanged={onChanged}
                    onUpdate={onEdited}
                />
            ) : (
                <StyledCommentCard isNew={isNew} onClick={onDoubleCommentClick}>
                    <StyledCardInfo>
                        <div>
                            <Link inline>{author?.name}</Link> —{' '}
                            <Link inline href={`#${commentMask}${id}`}>
                                <RelativeTime locale={locale} date={createdAt} />
                            </Link>
                        </div>
                        <StyledCommentActions>
                            {nullable(isEditable, () => (
                                <span>
                                    <Icon type="editCircle" size="xs" noWrap onClick={() => setEditMode(true)} />
                                </span>
                            ))}
                            {nullable(reactionsGroupsNames.length < reactionsGroupsLimit, () => (
                                <ReactionsDropdown view="icon" onClick={onReactionToggle} />
                            ))}
                        </StyledCommentActions>
                    </StyledCardInfo>

                    <CardComment>
                        <Md>{commentDescription}</Md>

                        {nullable(reactions?.length, () => (
                            <StyledReactions>
                                <Reactions reactions={grouppedReactions} onClick={onReactionToggle} />
                            </StyledReactions>
                        ))}
                    </CardComment>
                </StyledCommentCard>
            )}
        </StyledComment>
    );
};
