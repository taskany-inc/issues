import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Button } from '@taskany/bricks';

import { Icon } from '../components/Icon';
import { UserPic } from '../components/UserPic';

export default {
    title: 'Taskany/Button',
    component: Button,
    args: {
        text: 'Button',
    },
} as ComponentMeta<typeof Button>;

const Template: ComponentStory<typeof Button> = (args) => <Button {...args} />;

export const Default = Template.bind({});

export const WithIconLeft = Template.bind({});
WithIconLeft.args = {
    iconLeft: <Icon noWrap size="xs" type="cog" />,
};

export const WithIconRight = Template.bind({});
WithIconRight.args = {
    iconRight: <Icon noWrap size="xs" type="location" />,
};

export const WithUserPic = Template.bind({});
WithUserPic.args = {
    iconLeft: <UserPic size={16} src="https://avatars.githubusercontent.com/u/982072?s=40&v=4" />,
};
