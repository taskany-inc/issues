import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { ReactionsDropdown } from '../components/ReactionsDropdown';

export default {
    title: 'Taskany/ReactionsDropdown',
    component: ReactionsDropdown,
    args: {},
} as ComponentMeta<typeof ReactionsDropdown>;

const Template: ComponentStory<typeof ReactionsDropdown> = (args) => <ReactionsDropdown {...args} />;

export const Default = Template.bind({});
