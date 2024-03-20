import { Text } from '@taskany/bricks/harmony';
import cn from 'classnames';

import s from './PageTitle.module.css';

interface PageTitleProps {
    title?: string;
    subtitle?: string;
    info?: string;

    onClick?: () => void;
}

export const PageTitle: React.FC<PageTitleProps> = ({ title, subtitle, info, onClick }) => (
    <>
        {title}

        {subtitle && (
            <>
                :
                <Text
                    className={cn(s.PageTitleText, { [s.PageTitleText_hovered]: Boolean(onClick) })}
                    as="span"
                    size="xxl"
                    weight="bolder"
                    onClick={onClick}
                >
                    {subtitle}
                </Text>
            </>
        )}

        {info && (
            <Text className={cn(s.PageTitleText, s.PageTitleInfo)} as="span" size="s" weight="bold">
                {info}
            </Text>
        )}
    </>
);
