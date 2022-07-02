import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { Tip } from '../components/Tip';
import { Icon } from '../components/Icon';

export default {
    title: 'Taskany/Tip',
    component: Tip,
    args: {
        children: 'Tick tak toe',
    },
} as ComponentMeta<typeof Tip>;

const Template: ComponentStory<typeof Tip> = (args) => <Tip {...args} />;

export const Default = Template.bind({});
export const WithTitle = Template.bind({});

WithTitle.args = {
    title: 'Tip title',
};

export const WithTitleAndIcon = Template.bind({});
WithTitleAndIcon.args = {
    title: 'Tip title',
    icon: <Icon type="question" size="s" />,
};
