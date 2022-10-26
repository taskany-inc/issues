import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { CommentView } from '../components/CommentView';

// @ts-ignore
export default {
    title: 'Taskany/Comment',
    component: CommentView,
    args: {
        author: {
            __typename: 'User',
            image: 'https://randomuser.me/api/portraits/men/1.jpg',
            name: 'Vanessa Barrett',
        },
        comment:
            "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type",
        createdAt: Date.now(),
    },
} as ComponentMeta<typeof CommentView>;
const Template: ComponentStory<typeof CommentView> = (args) => <CommentView {...args} />;

export const Default = Template.bind({});
