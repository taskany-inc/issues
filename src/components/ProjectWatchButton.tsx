import React, { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';

import { Project } from '../../graphql/@generated/genql';
import { gql } from '../utils/gql';

import { Button } from './Button';
import { Icon } from './Icon';

interface ProjectWatchButtonProps {
    activityId: string;
    projectId: number;
    watchers: Project['watchers'];
}

export const ProjectWatchButton: React.FC<ProjectWatchButtonProps> = ({ activityId, projectId, watchers }) => {
    const t = useTranslations('ProjectWatchButton');
    // @ts-ignore unexpectable trouble with filter
    const [watcher, setWatcher] = useState(watchers?.filter(({ id }) => id === activityId).length > 0);

    const onWatchToggle = useCallback(async () => {
        const promise = gql.mutation({
            toggleProjectWatcher: [
                {
                    data: {
                        id: String(projectId),
                        direction: !watcher,
                    },
                },
                {
                    id: true,
                },
            ],
        });

        toast.promise(promise, {
            error: t('Something went wrong 😿'),
            loading: t('We are calling owner'),
            success: t(!watcher ? 'Voila! You are watcher now 🎉' : 'So sad! Project will miss you'),
        });

        setWatcher((w) => !w);

        await promise;
    }, [watcher, projectId, t]);

    return (
        <Button
            text={t(watcher ? 'Watching' : 'Watch')}
            iconLeft={<Icon noWrap type={watcher ? 'eye' : 'eyeClosed'} size="s" />}
            onClick={onWatchToggle}
        />
    );
};
