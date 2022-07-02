import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { EstimateDropdown } from '../components/EstimateDropdown';
import { estimatedMeta } from '../utils/dateTime';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
    title: 'Taskany/EstimateDropdown',
    component: EstimateDropdown,
    args: {
        text: 'Schedule',
        mask: 'Date input mask',
        defaultValuePlaceholder: estimatedMeta(),
    },
} as ComponentMeta<typeof EstimateDropdown>;

export const estimateDropdown: ComponentStory<typeof EstimateDropdown> = (args) => <EstimateDropdown {...args} />;
