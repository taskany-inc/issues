import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import EstimateDropdownComponent from '../components/EstimateDropdown';
import { estimatedMeta } from '../utils/dateTime';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
    title: 'Taskany/EstimateDropdown',
    component: EstimateDropdownComponent,
    args: {
        text: 'Schedule',
        mask: 'Date input mask',
        defaultValuePlaceholder: estimatedMeta({ locale: 'en' }),
    },
} as ComponentMeta<typeof EstimateDropdownComponent>;

export const EstimateDropdown: ComponentStory<typeof EstimateDropdownComponent> = (args) => (
    <EstimateDropdown {...args} />
);
