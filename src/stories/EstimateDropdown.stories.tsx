import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { EstimateComboBox } from '../components/EstimateComboBox';
import { estimatedMeta } from '../utils/dateTime';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
    title: 'Taskany/EstimateDropdown',
    component: EstimateComboBox,
    args: {
        text: 'Schedule',
        mask: 'Date input mask',
        defaultValuePlaceholder: estimatedMeta({ locale: 'en' }),
    },
} as ComponentMeta<typeof EstimateComboBox>;

export const EstimateDropdown: ComponentStory<typeof EstimateComboBox> = (args) => <EstimateComboBox {...args} />;
