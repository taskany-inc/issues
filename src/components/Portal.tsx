import { createPortal } from 'react-dom';

import { usePortal } from '../hooks/usePortal';

interface PortalProps {
    id: string;
    children: React.ReactNode;
}

export const Portal: React.FC<PortalProps> = ({ id, children }) => createPortal(children, usePortal(id));
