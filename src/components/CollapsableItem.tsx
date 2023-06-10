import { FC, ReactNode } from 'react';
import styled, { css } from 'styled-components';
import { gray7, radiusM } from '@taskany/colors';

export const collapseOffset = 20;

const dotSize = 8;
const dot = css`
    position: absolute;
    top: 50%;
    width: ${dotSize}px;
    height: ${dotSize}px;
    margin-top: -${dotSize / 2}px;
    left: ${collapseOffset / 2 - dotSize / 2}px;

    border-radius: 100%;
    background: ${gray7};
`;

const line = css`
    position: absolute;
    width: 1px;
    top: 0;
    bottom: 0;
    left: ${collapseOffset / 2}px;
    background: ${gray7};
    z-index: 1;
`;

const Dot = styled.div`
    display: none;
    ${dot}
`;

const ParentDot = styled(Dot)``;

const CollapseHeader = styled.div`
    border-radius: ${radiusM};
`;

export const TableRowCollapseContent = styled.div`
    position: relative;

    &:before {
        content: '';
        ${line}
        margin-left: -${collapseOffset}px;
    }
`;

const TableRowCollapseContainer = styled.div<{ collapsed: boolean; deep: number; showLine: boolean }>`
    position: relative;

    border-radius: ${radiusM};

    ${({ collapsed, deep, showLine }) =>
        !collapsed &&
        css`
            padding-left: ${collapseOffset}px;
            margin-left: 0px !important; // TODO: fix me

            /** show dot and add paddings for earch item is opened */

            & > & {
                padding-left: ${collapseOffset}px;
                margin-left: -${collapseOffset}px;
            }

            & > & > ${CollapseHeader}, & > ${CollapseHeader} {
                padding-left: ${collapseOffset}px;
                margin-left: -${collapseOffset}px;
                position: relative;

                /** display dot */

                > ${Dot} {
                    display: block;
                }
            }

            /** add parent dot if not first lvl */

            & > ${CollapseHeader} > ${ParentDot} {
                ${deep > 0 &&
                css`
                    display: block;
                    margin-left: -${collapseOffset}px;
                `}
            }

            /** first item vertical line */

            & > &:before,
            & > ${CollapseHeader}:before {
                content: '';
                ${line}
            }

            & > ${TableRowCollapseContent}:before, & > ${CollapseHeader}:before {
                ${!showLine && 'display: none;'}
            }

            /** middle item vertical line */

            & > ${CollapseHeader}:before {
                top: 50%;
            }

            /** last item vertical line */

            & > &:last-of-type:before {
                bottom: 50%;
            }

            &:before {
                margin-left: -${collapseOffset}px;
            }

            &:last-of-type:before {
                display: none;
            }

            &:last-of-type > ${CollapseHeader}:after {
                content: '';
                ${line}
                margin-left: -${collapseOffset}px;
                bottom: 50%;

                ${deep === 0 && 'display: none;'}
            }
        `}
`;

export const TableRowCollapse: FC<{
    children?: ReactNode;
    onClick?: () => void;
    header: ReactNode;
    deep?: number;
    collapsed: boolean;
    showLine?: boolean;
}> = ({ onClick, children, header, collapsed, deep = 0, showLine = true }) => {
    return (
        <TableRowCollapseContainer collapsed={collapsed} deep={deep} showLine={showLine}>
            <CollapseHeader onClick={onClick}>
                <ParentDot />
                <Dot />
                {header}
            </CollapseHeader>
            {!collapsed ? children : null}
        </TableRowCollapseContainer>
    );
};
