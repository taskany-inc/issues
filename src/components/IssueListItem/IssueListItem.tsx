import NextLink from 'next/link';
import { nullable } from '@taskany/bricks';
import { Text, Link } from '@taskany/bricks/harmony';
import cn from 'classnames';

import { routes } from '../../hooks/router';
import { StateDot } from '../StateDot/StateDot';

import s from './IssueListItem.module.css';

interface IssueListItemProps {
    issue: {
        id: string;
        _shortId: string;
        title: string;
        state?: {
            title: string;
            hue: number;
        } | null;
    };
    size?: React.ComponentProps<typeof Text>['size'];
    strike?: boolean;
    className?: string;
}

export const IssueListItem: React.FC<IssueListItemProps> = ({ issue, className, size = 's', strike }) => {
    return (
        <NextLink passHref href={routes.goal(issue._shortId)} legacyBehavior>
            <Link view="inline">
                <div className={cn(s.IssueListItem, className)}>
                    {nullable(issue.state, (state) => (
                        <div className={cn(s.DotWrapper, { [s.DotWrapper_size_xs]: size === 'xs' })}>
                            <StateDot title={state.title} hue={state.hue} size={size !== 'xs' ? 'm' : 's'} />
                        </div>
                    ))}
                    <Text className={s.IssueListItemTitle} size={size} weight="bold" strike={strike}>
                        {issue.title}
                    </Text>
                </div>
            </Link>
        </NextLink>
    );
};
