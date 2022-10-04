import styled from 'styled-components';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import dynamic from 'next/dynamic';

import type { Scalars, State, Tag, UserAnyKind } from '../../graphql/@generated/genql';
import { gray4, textColor, gray10, gapM, gapS } from '../design/@generated/themes';
import { nullable } from '../utils/nullable';

import { Text } from './Text';
import { Tag as TagItem } from './Tag';
import { Icon } from './Icon';
import { UserPic } from './UserPic';
import { StateDot } from './StateDot';

const RelativeTime = dynamic(() => import('./RelativeTime'));

interface GoalItemProps {
    title: string;
    issuer?: UserAnyKind;
    id: string;
    tags?: Array<Tag | undefined>;
    state?: State;
    createdAt: Scalars['DateTime'];
    owner?: UserAnyKind;
    comments?: number;
    hasForks?: boolean;
    isNotViewed?: boolean;
}

const StyledGoal = styled.a`
    display: grid;
    grid-template-columns: 15px 30px 600px repeat(3, 40px);
    align-items: center;

    color: ${textColor};
    text-decoration: none;

    &:hover {
        background-color: ${gray4};
    }
    &:visited {
        color: ${textColor};
    }

    padding: ${gapM} 0;
`;

const StyledState = styled.div`
    align-self: start;
    justify-self: center;

    padding-top: 5px;
`;

const StyledNotViewed = styled.div`
    align-self: start;
    justify-self: center;
`;

const StyledNotViewedDot = styled.div`
    width: 5px;
    height: 5px;

    background-color: ${textColor};

    border-radius: 100%;
`;

const StyledName = styled.div`
    width: 800px;
    max-width: 100%;
    display: flex;
    flex-wrap: wrap;
`;

const StyledTitle = styled(Text)`
    margin-right: ${gapS};
`;

const StyledAddon = styled.div`
    justify-self: center;
    align-self: center;
    vertical-align: middle;
`;

const StyledCommentsCount = styled(Text)`
    display: inline-block;
    margin-left: ${gapS};
    vertical-align: top;
`;

const StyledSubTitle = styled(Text)`
    color: ${gray10};
    width: 100%;
    padding-top: ${gapS};
`;

const StyledTags = styled.div`
    padding-top: 1px;
`;

const StyledTag = styled(TagItem)`
    margin-right: ${gapS};
`;

const StyledIcon = styled(Icon)`
    vertical-align: middle;
`;

export const GoalItem: React.FC<GoalItemProps> = ({
    id,
    owner,
    issuer,
    createdAt,
    tags,
    title,
    comments,
    hasForks,
    isNotViewed,
    state,
}) => {
    const t = useTranslations('goals.item');

    return (
        <Link href={`/goals/${id}`} passHref>
            <StyledGoal>
                <StyledNotViewed>{isNotViewed && <StyledNotViewedDot />}</StyledNotViewed>
                <StyledState>
                    {nullable(state, (s) => (
                        <StateDot size="m" hue={s.hue} />
                    ))}
                </StyledState>

                <StyledName>
                    <StyledTitle size="m" weight="bold">
                        {' '}
                        {title}
                    </StyledTitle>

                    <StyledTags>
                        {tags?.map((tag) =>
                            nullable(tag, (t) => <StyledTag key={t.id} title={t.title} description={t.description} />),
                        )}
                    </StyledTags>

                    <StyledSubTitle size="s">
                        #{id} <RelativeTime date={createdAt} kind="created" />
                        {`  ${t('by')} ${issuer?.name}`}
                    </StyledSubTitle>
                </StyledName>

                <StyledAddon>
                    <UserPic src={owner?.image} email={owner?.email} size={24} />
                </StyledAddon>

                <StyledAddon>{hasForks && <Icon type="gitFork" size="s" />}</StyledAddon>

                <StyledAddon>
                    {comments !== 0 && (
                        <>
                            <StyledIcon type="message" size="s" />
                            <StyledCommentsCount size="xs" weight="bold">
                                {comments}
                            </StyledCommentsCount>
                        </>
                    )}
                </StyledAddon>
            </StyledGoal>
        </Link>
    );
};
