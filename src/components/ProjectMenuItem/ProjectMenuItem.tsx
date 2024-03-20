import { Text } from '@taskany/bricks/harmony';
import { HTMLAttributes } from 'react';
import cn from 'classnames';

import { comboboxItem } from '../../utils/domObjects';

import s from './ProjectMenuItem.module.css';

interface ProjectMenuItemProps {
    title?: string;
    focused?: boolean;

    onClick?: () => void;
}

export const ProjectMenuItem: React.FC<ProjectMenuItemProps & HTMLAttributes<HTMLDivElement>> = ({
    title,
    focused,
    className,
    onClick,
    ...rest
}) => (
    <div
        className={cn(s.ProjectMenuItem, { [s.ProjectMenuItem_focused]: focused }, className)}
        onClick={onClick}
        {...rest}
        {...comboboxItem.attr}
    >
        <Text size="s" weight="bold">
            {title}
        </Text>
    </div>
);
