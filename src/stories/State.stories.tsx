import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { State } from '../components/State';

export default {
    title: 'Taskany/State',
    component: State,
    args: {
        title: 'InProgress',
    },
} as ComponentMeta<typeof State>;

const Template: ComponentStory<typeof State> = (args) => <State {...args} />;

export const Default = Template.bind({});
