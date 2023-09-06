import { MouseEventHandler, useCallback } from 'react';
import styled from 'styled-components';
import { gapS, gapXs, gray4 } from '@taskany/colors';

import { TreeViewNode } from './TreeView';
import { ProjectListItemProps } from './ProjectListItem';

export const ProjectTreeNode = styled(TreeViewNode)`
    padding-bottom: ${gapS};
`;

interface ProjectTreeNodeTitleProps {
    children: React.ReactElement<ProjectListItemProps>;
    decorated?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const StyledProjectTreeNodeTitle = styled(({ decorated, ...props }) => <div {...props} />)<ProjectTreeNodeTitleProps>`
    margin-left: ${gapXs};

    border-bottom: 1px solid transparent;

    ${({ decorated }) =>
        decorated &&
        `
        border-bottom-color: ${gray4};
    `}
`;

export const ProjectTreeNodeTitle: React.FC<ProjectTreeNodeTitleProps> = ({ children, decorated }) => {
    const onClick = useCallback<MouseEventHandler<HTMLAnchorElement>>((e) => {
        if (e.metaKey || e.ctrlKey) return;

        e.preventDefault();

        // follows ContentToggle behaviour
    }, []);

    return (
        <StyledProjectTreeNodeTitle decorated={decorated} onClick={onClick}>
            {children}
        </StyledProjectTreeNodeTitle>
    );
};
