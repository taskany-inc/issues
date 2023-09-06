import React, { useMemo, useState } from 'react';
import styled, { css } from 'styled-components';
import { backgroundColor, gapS, gray7 } from '@taskany/colors';

import { ContentToggle } from './ContentToggle';

type ValidChild = React.ReactElement<typeof TreeViewNode | typeof TreeViewElement>;

interface TreeViewNodeProps {
    renderTitle: (props: { visible?: boolean }) => React.ReactNode;
    children?: ValidChild[] | ValidChild;
    visible?: boolean;
    className?: string;
}

const StyledNodeMarker = styled.div`
    z-index: 3;

    width: 8px;
    height: 8px;

    border-radius: 100%;

    background-color: ${gray7};

    margin-right: 4px;
`;

const StyledNodeTitleContent = styled.div`
    width: 100%;
`;

const StyledNodeTitle = styled.div`
    display: flex;
    align-items: center;

    margin-left: -12px;
`;

const StyledTreeViewNode = styled(ContentToggle)<{ recursive: boolean }>`
    box-sizing: border-box;

    position: relative;

    ${({ visible, recursive }) =>
        visible &&
        recursive &&
        css`
            &::after {
                content: ' ';
                position: absolute;
                z-index: 1;
                width: 1px;
                left: -8px;
                top: 8px;
                height: calc(100% - 16px);

                background-color: ${gray7};
            }
        `}

    ${({ visible, recursive }) =>
        visible &&
        !recursive &&
        css`
            &::after {
                content: ' ';
                position: absolute;
                z-index: 2;
                width: 1px;
                left: -8px;
                top: 14px;
                height: calc(100% - 14px);

                background-color: ${backgroundColor};
            }
        `}
`;

export const TreeViewElement = styled.div`
    box-sizing: border-box;

    padding-left: ${gapS};
`;

export const TreeViewNode: React.FC<TreeViewNodeProps> = ({
    renderTitle,
    children,
    visible: defaultVisible,
    className,
}) => {
    const [visible, setVisible] = useState(defaultVisible);
    const recursive = useMemo(
        () => Boolean(React.Children.map(children, (child) => child?.type === TreeViewNode)?.filter(Boolean).length),
        [children],
    );

    return (
        <StyledTreeViewNode
            title={
                <StyledNodeTitle>
                    <StyledNodeMarker />
                    <StyledNodeTitleContent>{renderTitle({ visible })}</StyledNodeTitleContent>
                </StyledNodeTitle>
            }
            className={className}
            visible={visible}
            recursive={recursive}
            onShow={() => setVisible(true)}
            onHide={() => setVisible(false)}
        >
            {children}
        </StyledTreeViewNode>
    );
};

export const TreeView = styled.div``;
