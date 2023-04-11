import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Input } from '@taskany/bricks';

export default {
    title: 'Taskany/Input',
    component: Input,
    args: {
        defaultValue: 'Taskany',
    },
} as ComponentMeta<typeof Input>;

const Template: ComponentStory<typeof Input> = (args) => <Input {...args} />;

export const Default = Template.bind({});
