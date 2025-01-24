import React from 'react';

import { CommonHeader } from '../CommonHeader';

import { tr } from './ExplorePageHeader.i18n';

export const ExplorePageHeader: React.FC = () => {
    return <CommonHeader title={tr('Explore')} />;
};
