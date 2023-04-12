import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { QuestionIcon } from '@taskany/bricks';

import { Tip } from '../components/Tip';

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
    icon: <QuestionIcon size="s" />,
};
