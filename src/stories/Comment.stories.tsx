import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { Comment } from '../components/Comment';

// @ts-ignore
export default {
    title: 'Taskany/Comment',
    component: Comment,
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
} as ComponentMeta<typeof Comment>;
const Template: ComponentStory<typeof Comment> = (args) => <Comment {...args} />;

export const Default = Template.bind({});
