import React, { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';

import { Project } from '../../graphql/@generated/genql';
import { gql } from '../utils/gql';

import { Button } from './Button';
import { Icon } from './Icon';
import { Badge } from './Badge';

interface ProjectStarButtonProps {
    activityId: string;
    projectId: number;
    stargizers: Project['stargizers'];
}

export const ProjectStarButton: React.FC<ProjectStarButtonProps> = ({ activityId, projectId, stargizers }) => {
    const t = useTranslations('ProjectStarButton');
    // @ts-ignore unexpectable trouble with filter
    const [stargizer, setStargizer] = useState(
        // @ts-ignore unexpectable trouble with filter
        stargizers?.filter(({ id }) => id === activityId).length > 0,
    );

    const onStarToggle = useCallback(async () => {
        const promise = gql.mutation({
            toggleProjectStargizer: [
                {
                    data: {
                        id: String(projectId),
                        direction: !stargizer,
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
            success: t(!stargizer ? 'Voila! You are stargizer now 🎉' : 'So sad! Goal will miss you'),
        });

        setStargizer((s) => !s);

        await promise;
    }, [stargizer, projectId, t]);

    return (
        <Button
            text={t(stargizer ? 'Starred' : 'Stars')}
            iconLeft={<Icon noWrap type={stargizer ? 'starFilled' : 'star'} size="s" />}
            iconRight={<Badge>{stargizers?.length}</Badge>}
            onClick={onStarToggle}
        />
    );
};
