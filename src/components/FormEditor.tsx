/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/display-name */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { FieldError } from 'react-hook-form';
import styled, { css } from 'styled-components';

import { gray2, gray3, gray6, radiusS, textColor } from '../design/@generated/themes';
import { nullable } from '../utils/nullable';

const Editor = dynamic(() => import('@monaco-editor/react'));

interface FormEditorProps {
    id?: string;
    name?: string;
    value?: string;
    defaultValue?: string;
    autoFocus?: boolean;
    flat?: 'top' | 'bottom' | 'both';
    height?: string;
    placeholder?: string;

    onChange?: (value: string | undefined) => void;
    onBlur?: React.FocusEventHandler<HTMLDivElement>;
    onFocus?: React.FocusEventHandler<HTMLDivElement>;

    error?: FieldError;
}

const defaultOptions: React.ComponentProps<typeof Editor>['options'] = {
    fontSize: 16,
    minimap: {
        enabled: false,
    },
    lineNumbers: 'off',
    unicodeHighlight: {
        allowedLocales: {
            en: true,
            ru: true,
        },
    },
    overviewRulerBorder: false,
};

const StyledEditor = styled.div<{ flat: FormEditorProps['flat'] }>`
    position: relative;
    box-sizing: border-box;

    outline: none;
    border: 0;
    border-radius: ${radiusS};

    background-color: ${gray3};

    ${({ flat }) =>
        flat === 'top' &&
        css`
            border-top-left-radius: 0;
            border-top-right-radius: 0;
        `}

    ${({ flat }) =>
        flat === 'bottom' &&
        css`
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
        `}

    ${({ flat }) =>
        flat === 'both' &&
        css`
            border-radius: 0;
        `}

    .monaco-editor {
        background-color: ${gray3};

        color: ${textColor};

        transition: 100ms cubic-bezier(0.3, 0, 0.5, 1);
        transition-property: background-color, height;

        .monaco-editor-background,
        .margin,
        .inputarea.ime-input {
            background-color: ${gray3};

            transition: 150ms cubic-bezier(0.3, 0, 0.5, 1);
            transition-property: background-color, height;
        }

        .inputarea.ime-input,
        .mtk1 {
            color: ${textColor};
        }

        .view-overlays .current-line {
            border: 0;
        }

        .monaco-scrollable-element {
            margin-left: -10px;
            padding-left: 10px;

            & > .scrollbar > .slider {
                background-color: ${gray3};
            }
        }

        .lines-content {
            margin-top: 8px;
        }
    }

    .monaco-editor.focused {
        background-color: ${gray2};

        .monaco-editor-background,
        .margin,
        .inputarea.ime-input {
            background-color: ${gray2};
        }
    }
`;

const StyledPlaceholder = styled.div`
    position: absolute;
    top: 5px;
    left: 8px;
    z-index: 999;

    pointer-events: none;

    font-size: ${defaultOptions.fontSize}px;
    color: ${gray6};
`;

export const FormEditor = React.forwardRef<HTMLDivElement, FormEditorProps>(
    ({ id, defaultValue, value, flat, autoFocus, height = '200px', placeholder, onChange, onFocus, onBlur }, ref) => {
        const [focused, setFocused] = useState(false);
        const monacoEditorRef = useRef<any>(null);

        const handleEditorDidMount = (editor: any /* IStandaloneEditor */) => {
            monacoEditorRef.current = editor;
        };

        // useEffect(() => {
        //     if (monaco) {
        //         console.log('here is the monaco instance:', monaco);
        //     }
        // }, [monaco]);

        useEffect(() => {
            if (monacoEditorRef.current && autoFocus) {
                monacoEditorRef.current.focus();
            }
        }, [autoFocus]);

        const onEditorFocus = useCallback(
            (e) => {
                setFocused(true);
                onFocus && onFocus(e);
            },
            [onFocus],
        );

        const onEditorBlur = useCallback(
            (e) => {
                setFocused(false);
                onBlur && onBlur(e);
            },
            [onBlur],
        );

        return (
            <StyledEditor tabIndex={0} id={id} flat={flat} ref={ref} onFocus={onEditorFocus} onBlur={onEditorBlur}>
                {nullable(!focused && !value && placeholder, () => (
                    <StyledPlaceholder>{placeholder}</StyledPlaceholder>
                ))}
                <Editor
                    loading=""
                    theme="vs-dark"
                    height={height}
                    defaultLanguage="markdown"
                    value={value}
                    defaultValue={defaultValue}
                    options={defaultOptions}
                    onChange={onChange}
                    onMount={handleEditorDidMount}
                />
            </StyledEditor>
        );
    },
);
