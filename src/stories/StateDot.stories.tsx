import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { StateDot } from '../components/StateDot';

export default {
    title: 'Taskany/StateDot',
    component: StateDot,
    args: {},
} as ComponentMeta<typeof StateDot>;

const Template: ComponentStory<typeof StateDot> = (args) => <StateDot {...args} />;

export const Default = Template.bind({});
