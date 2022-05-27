import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { Text } from '../components/Text';

export default {
    title: 'Taskany/Text',
    component: Text,
    args: {
        children: 'Some text for Text component',
    },
} as ComponentMeta<typeof Text>;

const Template: ComponentStory<typeof Text> = (args) => <Text {...args} />;

export const Default = Template.bind({});
