import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { Dot } from '../components/Dot';

export default {
    title: 'Taskany/Dot',
    component: Dot,
    args: {},
} as ComponentMeta<typeof Dot>;

const Template: ComponentStory<typeof Dot> = (args) => <Dot {...args} />;

export const Default = Template.bind({});
