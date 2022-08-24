import styled from 'styled-components';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import dynamic from 'next/dynamic';

import type { Scalars, State, Tag, UserAnyKind } from '../../graphql/@generated/genql';
import { gray4, textColor, gray10 } from '../design/@generated/themes';

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
    tags?: Tag[];
    state?: State;
    createdAt: Scalars['DateTime'];
    owner?: UserAnyKind;
    comments?: number;
    hasForks?: boolean;
    isNotViewed?: boolean;
}

const StyledGoal = styled.a`
    display: grid;
    grid-template-columns: 15px 30px 600px repeat(3, 70px);
    align-items: center;
    color: ${textColor};
    text-decoration: none;
    &:hover {
        background-color: ${gray4};
    }
    &:visited {
        color: ${textColor};
    }

    padding: 10px 24px;
`;

const StyledState = styled.div`
    align-self: start;
    justify-self: center;
    padding-top: 7px;
`;

const StyledNotViewed = styled.div`
    align-self: start;
    justify-self: center;
    padding-top: 11px;
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
    margin-bottom: 8px;
    margin-right: 17px;
    min-height: 23px;
    margin-top: 2px;
`;

const StyledAddon = styled.div`
    justify-self: center;
    align-self: center;
`;

const StyledCommentsCount = styled.span`
    font-size: 14px;
    margin-left: 9px;
    vertical-align: top;
`;

const StyledSubTitle = styled(Text)`
    color: ${gray10};
    width: 100%;
`;

const StyledTags = styled.div`
    margin-bottom: 8px;
`;

const StyledTag = styled(TagItem)`
    margin-left: 6px;
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
                <StyledState>{state && <StateDot size="m" hue={state.hue} />}</StyledState>

                <StyledName>
                    <StyledTitle size="m" weight="bold">
                        {' '}
                        {title}
                    </StyledTitle>
                    <StyledTags>
                        {tags?.map(
                            (tag) => tag && <StyledTag key={tag.id} title={tag.title} description={tag.description} />,
                        )}
                    </StyledTags>
                    <StyledSubTitle size="s">
                        #{id} <RelativeTime date={createdAt} kind="created" />
                        {`  ${t('by')} ${issuer?.name}`}
                    </StyledSubTitle>
                </StyledName>
                <StyledAddon>{hasForks && <Icon type="gitFork" size="s" />}</StyledAddon>
                <StyledAddon>
                    {comments && (
                        <>
                            <Icon type="message" size="s" /> <StyledCommentsCount>{comments}</StyledCommentsCount>
                        </>
                    )}
                </StyledAddon>

                <StyledAddon>{owner && <UserPic size={16} src={owner?.image} />}</StyledAddon>
            </StyledGoal>
        </Link>
    );
};
