import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { Link } from '../components/Link';

export default {
    title: 'Taskany/Link',
    component: Link,
    args: {
        children: 'Link',
    },
} as ComponentMeta<typeof Link>;

const Template: ComponentStory<typeof Link> = (args) => <Link {...args} />;

export const Default = Template.bind({});
