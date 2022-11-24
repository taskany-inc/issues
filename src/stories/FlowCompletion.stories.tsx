import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { FlowComboBox } from '../components/FlowComboBox';
// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
    title: 'Taskany/FlowComboBox',
    component: FlowComboBox,
    args: {
        text: 'Flow',
    },
} as ComponentMeta<typeof FlowComboBox>;

export const Default: ComponentStory<typeof FlowComboBox> = (args) => <FlowComboBox {...args} />;
