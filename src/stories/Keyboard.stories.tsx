import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { Keyboard } from '../components/Keyboard';

export default {
    title: 'Taskany/Keyboard',
    component: Keyboard,
    args: {
        children: 'A',
    },
} as ComponentMeta<typeof Keyboard>;

const Template: ComponentStory<typeof Keyboard> = (args) => <Keyboard {...args} />;

export const Default = Template.bind({});
