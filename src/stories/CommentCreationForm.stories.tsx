import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { CommentCreationForm } from '../components/CommentCreationForm';

export default {
    title: 'Taskany/CommentCreationForm',
    component: CommentCreationForm,
} as ComponentMeta<typeof CommentCreationForm>;
const Template: ComponentStory<typeof CommentCreationForm> = (args) => <CommentCreationForm {...args} />;

export const Default = Template.bind({});
