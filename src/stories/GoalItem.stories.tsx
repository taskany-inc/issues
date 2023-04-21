import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { GoalListItem } from '../components/GoalListItem/GoalListItem';
import { Tag } from '../../graphql/@generated/genql';

export default {
    title: 'Taskany/GoalItem',
    component: GoalListItem,
    args: {
        title: 'Test goal',
        id: 'TST-1',
        state: {
            id: 'test-sate',
            title: 'Draft',
            hue: 4,
            __typename: 'State',
        },
        issuer: {
            user: {
                name: 'Petr Nikitin',
            },
        },
    },
} as ComponentMeta<typeof GoalListItem>;
const Template: ComponentStory<typeof GoalListItem> = (args) => <GoalListItem {...args} />;

const createTags = (tagsNumber: number): Tag[] => {
    return new Array(tagsNumber).fill('').map((tag, index) => ({
        id: `tag-${index}`,
        activityId: '1234',
        title: Math.random() > 0.5 ? 'short tag' : 'logn long long tag',
        __typename: 'Tag',
    }));
};

export const Default = Template.bind({});
Default.args = {
    createdAt: '2022-05-24T10:07:12.887Z',
};

export const NotViewed = Template.bind({});
NotViewed.args = {
    isNotViewed: true,
    createdAt: '2022-05-24T10:07:12.887Z',
};

export const WithTags = Template.bind({});
WithTags.args = {
    tags: createTags(2),
    createdAt: '2022-01-24T10:07:12.887Z',
};

export const WithTagsAndLongTitle = Template.bind({});
WithTagsAndLongTitle.args = {
    title: 'Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit',
    tags: createTags(8),
    createdAt: '2022-01-24T10:07:12.887Z',
};

export const WithOwnerPhoto = Template.bind({});
WithOwnerPhoto.args = {
    tags: createTags(4),
    createdAt: '2022-01-24T10:07:12.887Z',
    owner: {
        id: '1',
        createdAt: '2022-01-24T10:07:12.887Z',
        updatedAt: '2022-01-24T10:07:12.887Z',
        __typename: 'Activity',
        user: {
            id: '1',
            email: 'user@taskany.org',
            name: 'Test User',
            role: 'USER',
            image: 'https://www.beeztees.nl/wp-content/uploads/2017/01/shutterstock_235089946.jpg',
            createdAt: '2022-01-24T10:07:12.887Z',
            updatedAt: '2022-01-24T10:07:12.887Z',
            __typename: 'User',
        },
    },
};

export const WithOwnerIcon = Template.bind({});
WithOwnerIcon.args = {
    tags: createTags(2),
    createdAt: '2022-01-24T10:07:12.887Z',
    owner: {
        id: '1',
        createdAt: '2022-01-24T10:07:12.887Z',
        updatedAt: '2022-01-24T10:07:12.887Z',
        __typename: 'Activity',
        user: {
            id: '1',
            email: 'user@taskany.org',
            name: 'Test User',
            role: 'USER',
            image: 'https://www.beeztees.nl/wp-content/uploads/2017/01/shutterstock_235089946.jpg',
            createdAt: '2022-01-24T10:07:12.887Z',
            updatedAt: '2022-01-24T10:07:12.887Z',
            __typename: 'User',
        },
    },
};

export const WithCommentsForkAndOwner = Template.bind({});
WithCommentsForkAndOwner.args = {
    tags: createTags(4),
    createdAt: '2022-01-24T10:07:12.887Z',
    hasForks: true,
    comments: 42,
    owner: {
        id: '1',
        createdAt: '2022-01-24T10:07:12.887Z',
        updatedAt: '2022-01-24T10:07:12.887Z',
        __typename: 'Activity',
        user: {
            id: '1',
            email: 'user@taskany.org',
            name: 'Test User',
            role: 'USER',
            image: 'https://www.beeztees.nl/wp-content/uploads/2017/01/shutterstock_235089946.jpg',
            createdAt: '2022-01-24T10:07:12.887Z',
            updatedAt: '2022-01-24T10:07:12.887Z',
            __typename: 'User',
        },
    },
};
