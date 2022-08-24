import styled from 'styled-components';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';

import { gapS, gapXs, gray8 } from '../design/@generated/themes';
import { State } from '../../graphql/@generated/genql';
import { nullable } from '../utils/nullable';

import { Text } from './Text';
import { Dot } from './Dot';
import { Link } from './Link';

const RelativeTime = dynamic(() => import('./RelativeTime'));
const StateSwitch = dynamic(() => import('./StateSwitch'));

interface IssueStatsProps {
    state?: State;
    flow?: string;
    updatedAt: string;
    comments: number;

    onStateChange?: (state: State) => void;
    onCommentsClick?: () => void;
}

const StyledIssueStats = styled.div`
    padding-top: ${gapS};
`;

const StyledIssueInfo = styled.span`
    padding-left: ${gapXs};
`;

export const IssueStats: React.FC<IssueStatsProps> = ({
    state,
    flow,
    comments,
    updatedAt,
    onStateChange,
    onCommentsClick,
}) => {
    const t = useTranslations('IssueStats');

    return (
        <StyledIssueStats>
            {nullable(state, (s) => (
                <StateSwitch state={s} flowId={flow} onClick={onStateChange} />
            ))}

            <Text as="span" size="m" color={gray8}>
                <StyledIssueInfo>
                    {state ? <Dot /> : null} <RelativeTime kind="updated" date={updatedAt} /> <Dot />{' '}
                    {comments ? (
                        <Link inline href="#comments">
                            <b>{comments}</b> {t('comments')}
                        </Link>
                    ) : (
                        <Link inline onClick={onCommentsClick}>
                            {t('Add comment')}
                        </Link>
                    )}
                </StyledIssueInfo>
            </Text>
        </StyledIssueStats>
    );
};
