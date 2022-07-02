import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { GoalCreateForm } from '../components/GoalCreateForm';

export default {
    title: 'Taskany/GoalCreateForm',
    component: GoalCreateForm,
    args: {
        card: true,
    },
} as ComponentMeta<typeof GoalCreateForm>;
export const GoalForm: ComponentStory<typeof GoalCreateForm> = (args) => <GoalCreateForm {...args} />;
