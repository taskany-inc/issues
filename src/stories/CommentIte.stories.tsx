import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { CommentItem } from '../components/Comment';

export default {
    title: 'Taskany/CommentItem',
    component: CommentItem,
    args: {
        author: {
            __typename: 'UserAnyKind',
            image: 'https://randomuser.me/api/portraits/men/1.jpg',
            name: 'Vanessa Barrett',
        },
        comment:
            "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type",
        createdAt: Date.now(),
    },
} as ComponentMeta<typeof CommentItem>;
const Template: ComponentStory<typeof CommentItem> = (args) => <CommentItem {...args} />;

export const Default = Template.bind({});
