import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { Tag } from '../components/Tag';

export default {
    title: 'Taskany/Tag',
    component: Tag,
    args: {
        title: 'TypeScript',
        description: 'Programming language',
    },
} as ComponentMeta<typeof Tag>;

const Template: ComponentStory<typeof Tag> = (args) => <Tag {...args} />;

export const Default = Template.bind({});
