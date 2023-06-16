import { FC, ReactNode } from 'react';
import styled, { css } from 'styled-components';
import { gray7, radiusM } from '@taskany/colors';
import { nullable } from '@taskany/bricks';

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

const CollapsableHeader = styled.div`
    border-radius: ${radiusM};
`;

export const CollapsableItem = styled.div`
    position: relative;

    &:before {
        content: '';
        ${line}
        margin-left: -${collapseOffset}px;
    }
`;

const CollapsableContainer = styled.div<{ collapsed: boolean; deep: number; showLine: boolean }>`
    position: relative;

    border-radius: ${radiusM};

    > ${CollapsableItem}:before {
        display: none;
    }

    &:last-child:before {
        display: none;
    }

    &:last-child > ${CollapsableHeader}:after {
        content: '';
        ${line}

        bottom: 50%;

        ${({ deep }) => deep === 0 && 'display: none;'}
    }

    ${({ collapsed, deep }) =>
        !collapsed &&
        css`
            padding-left: ${collapseOffset}px;
            margin-left: 0px !important; // TODO: fix me

            /** show dot and add paddings for earch item is opened */

            & > & {
                padding-left: ${collapseOffset}px;
                margin-left: -${collapseOffset}px;
            }

            & > & > ${CollapsableHeader}, & > ${CollapsableHeader} {
                padding-left: ${collapseOffset}px;
                margin-left: -${collapseOffset}px;
                position: relative;

                /** display dot */

                > ${Dot} {
                    display: block;
                }
            }

            /** add parent dot if not first lvl */

            & > ${CollapsableHeader} > ${ParentDot} {
                ${deep > 0 &&
                css`
                    display: block;
                    margin-left: -${collapseOffset}px;
                `}
            }

            /** first item vertical line */

            & > &:before,
            & > ${CollapsableHeader}:before {
                content: '';
                ${line}
            }

            /** first item vertical line */

            & > ${CollapsableHeader}:before {
                top: 50%;
            }

            /** last item vertical line */

            & > &:last-of-type:before {
                bottom: 50%;
            }

            &:before {
                margin-left: -${collapseOffset}px;
            }

            &:last-child > ${CollapsableHeader}:after {
                margin-left: -${collapseOffset}px;
            }

            > ${CollapsableItem}:before {
                display: block;
            }
        `}
`;

export const Collapsable: FC<{
    children?: ReactNode;
    onClick?: () => void;
    header: ReactNode;
    content: ReactNode;
    deep?: number;
    collapsed: boolean;
    showLine?: boolean;
}> = ({ onClick, children, header, collapsed, deep = 0, showLine = true, content }) => {
    return (
        <CollapsableContainer collapsed={collapsed} deep={deep} showLine={showLine}>
            <CollapsableHeader onClick={onClick}>
                <ParentDot />
                <Dot />
                {header}
            </CollapsableHeader>
            {nullable(children, (ch) => (
                <CollapsableItem>{ch}</CollapsableItem>
            ))}
            {!collapsed ? content : null}
        </CollapsableContainer>
    );
};
