import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { FlowCompletion } from '../../components/FlowCompletion';
// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
    title: 'Taskany/FlowCompletion',
    component: FlowCompletion,
    args: {
        text: 'Flow',
    },
} as ComponentMeta<typeof FlowCompletion>;
export const flowCompletion: ComponentStory<typeof FlowCompletion> = (args) => <FlowCompletion {...args} />;
