import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { GoalItem } from '../../components/GoalItem';
import { Tag } from '../../../graphql/@generated/genql';

export default {
    title: 'Taskany/GoalItem',
    component: GoalItem,
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
            name: 'Petr Nikitin',
            __typename: 'UserAnyKind',
        },
    },
} as ComponentMeta<typeof GoalItem>;
const Template: ComponentStory<typeof GoalItem> = (args) => <GoalItem {...args} />;

const createTags = (tagsNumber: number): Tag[] => {
    return new Array(tagsNumber).fill('').map((tag, index) => ({
        id: `tag-${index}`,
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
        image: 'https://www.beeztees.nl/wp-content/uploads/2017/01/shutterstock_235089946.jpg',
        __typename: 'UserAnyKind',
    },
};

export const WithOwnerIcon = Template.bind({});
WithOwnerIcon.args = {
    tags: createTags(2),
    createdAt: '2022-01-24T10:07:12.887Z',
    owner: {
        name: 'Test User',
        __typename: 'UserAnyKind',
    },
};

export const WithCommentsForkAndOwner = Template.bind({});
WithCommentsForkAndOwner.args = {
    tags: createTags(4),
    createdAt: '2022-01-24T10:07:12.887Z',
    hasForks: true,
    comments: 42,
    owner: {
        image: 'https://www.beeztees.nl/wp-content/uploads/2017/01/shutterstock_235089946.jpg',
        name: 'Test User',
        __typename: 'UserAnyKind',
    },
};
