import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { Button } from '../../components/Button';

export default {
    title: 'Taskany/Button',
    component: Button,
    args: {
        text: 'Button',
    },
} as ComponentMeta<typeof Button>;

const Template: ComponentStory<typeof Button> = (args) => <Button {...args} />;

export const Default = Template.bind({});
Default.args = {
    view: 'default',
};

export const Primary = Template.bind({});
Primary.args = {
    view: 'primary',
};

export const Warning = Template.bind({});
Warning.args = {
    view: 'warning',
};

export const Danger = Template.bind({});
Danger.args = {
    view: 'danger',
};
