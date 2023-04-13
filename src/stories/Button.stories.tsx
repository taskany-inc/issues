import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Button, CogIcon, LocationIcon, UserPic } from '@taskany/bricks';

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
    iconLeft: <CogIcon noWrap size="xs" />,
};

export const WithIconRight = Template.bind({});
WithIconRight.args = {
    iconRight: <LocationIcon noWrap size="xs" />,
};

export const WithUserPic = Template.bind({});
WithUserPic.args = {
    iconLeft: <UserPic size={16} src="https://avatars.githubusercontent.com/u/982072?s=40&v=4" />,
};
