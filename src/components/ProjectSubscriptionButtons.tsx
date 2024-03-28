import { FC } from 'react';

import { useProjectResource } from '../hooks/useProjectResource';

import { StarButton } from './StarButton/StarButton';
import { WatchButton } from './WatchButton/WatchButton';

interface ProjectSubscriptionButtonsProps {
    id: string;
    starred?: boolean;
    watching?: boolean;
    stargizersCounter: number;
}

export const ProjectSubscriptionButtons: FC<ProjectSubscriptionButtonsProps> = ({
    id,
    starred,
    watching,
    stargizersCounter,
}) => {
    const { toggleProjectWatching, toggleProjectStar } = useProjectResource(id);

    return (
        <>
            <WatchButton watcher={watching} onToggle={toggleProjectWatching} />
            <StarButton stargizer={starred} count={stargizersCounter} onToggle={toggleProjectStar} />
        </>
    );
};
