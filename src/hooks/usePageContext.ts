import { useContext } from 'react';

import { pageContext } from '../utils/pageContext';

export const usePageContext = () => useContext(pageContext);
