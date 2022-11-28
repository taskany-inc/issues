import styled from 'styled-components';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';

import { gapXs, gray8 } from '../design/@generated/themes';
import { pluralize } from '../utils/pluralize';
import { TLocale } from '../types/locale';

import { Text } from './Text';
import { Dot } from './Dot';
import { Link } from './Link';

const RelativeTime = dynamic(() => import('./RelativeTime'));

interface IssueStatsProps {
    updatedAt: string;
    comments: number;
    locale: TLocale;
    mode?: 'compact' | 'default';

    onCommentsClick?: () => void;
}

const StyledIssueInfo = styled.span`
    padding-left: ${gapXs};
`;

export const IssueStats: React.FC<IssueStatsProps> = ({ comments, updatedAt, locale, mode, onCommentsClick }) => {
    const t = useTranslations('IssueStats');

    return (
        <Text as="span" size="m" color={gray8}>
            <StyledIssueInfo>
                <Dot />{' '}
                <RelativeTime kind={mode === 'compact' ? undefined : 'updated'} locale={locale} date={updatedAt} />{' '}
                <Dot />{' '}
                {comments ? (
                    <Link inline href="#comments">
                        <b>{comments}</b>{' '}
                        {pluralize({
                            locale,
                            count: comments,
                            one: t('comments.one'),
                            few: t('comments.few'),
                            many: t('comments.many'),
                        })}
                    </Link>
                ) : (
                    <Link inline onClick={onCommentsClick}>
                        {t('Add comment')}
                    </Link>
                )}
            </StyledIssueInfo>
        </Text>
    );
};
