import { nullable } from '@taskany/bricks';
import { Link, Text } from '@taskany/bricks/harmony';

import s from './CardHeader.module.css';

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    name?: string | null;
    timeAgo: React.ReactNode;
    href?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ name, timeAgo, href, ...attrs }) => {
    return (
        <div className={s.CardHeader} {...attrs}>
            {nullable(name, (n) => (
                <Text size="xs" weight="bold">
                    {n}
                </Text>
            ))}
            {nullable(timeAgo, (node) => (
                <>
                    {nullable(name, () => (
                        <span className={s.CardHeaderSeparator}>—</span>
                    ))}
                    {href ? (
                        <Link view="secondary" href={href}>
                            {node}
                        </Link>
                    ) : (
                        timeAgo
                    )}
                </>
            ))}
        </div>
    );
};
