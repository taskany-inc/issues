import { ComponentProps } from 'react';
import { nullable } from '@taskany/bricks';
import { Link, Text } from '@taskany/bricks/harmony';

import { State } from '../State';

import s from './CommentViewHeader.module.css';

interface CommentViewHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    name: string;
    timeAgo: React.ReactNode;
    href: string;
    state?: ComponentProps<typeof State>['state'];
}

export const CommentViewHeader: React.FC<CommentViewHeaderProps> = ({ name, timeAgo, href, state, ...attrs }) => {
    return (
        <div className={s.CommentViewHeader} {...attrs}>
            <Text size="s" weight="semiBold">
                {name}
            </Text>
            <span>—</span>
            <Link className={s.CommentViewHeaderLink} view="secondary" href={href}>
                {timeAgo}
            </Link>
            {nullable(state, (s) => (
                <State state={s} />
            ))}
        </div>
    );
};
