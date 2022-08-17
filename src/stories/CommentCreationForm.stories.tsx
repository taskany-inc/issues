import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { CommentCreateForm } from '../components/CommentCreateForm';

export default {
    title: 'Taskany/CommentCreationForm',
    component: CommentCreateForm,
} as ComponentMeta<typeof CommentCreateForm>;
const Template: ComponentStory<typeof CommentCreateForm> = (args) => <CommentCreateForm {...args} />;

export const Default = Template.bind({});
