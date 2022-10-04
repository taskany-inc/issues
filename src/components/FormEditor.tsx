/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/display-name */
import React, { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { FieldError } from 'react-hook-form';
import styled, { css } from 'styled-components';

import { gray2, gray3, radiusS, textColor } from '../design/@generated/themes';

const Editor = dynamic(() => import('@monaco-editor/react'));

interface FormEditorProps {
    id?: string;
    name?: string;
    value?: string;
    defaultValue?: string;
    autoFocus?: boolean;
    flat?: 'top' | 'bottom' | 'both';
    height?: string;

    onChange?: (value: string | undefined) => void;
    onInput?: React.ChangeEventHandler<HTMLTextAreaElement>;
    onBlur?: React.FocusEventHandler<HTMLTextAreaElement>;
    onFocus?: React.FocusEventHandler<HTMLTextAreaElement>;

    error?: FieldError;
}

const StyledEditor = styled.div<{ flat: FormEditorProps['flat'] }>`
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

        .monaco-editor-background,
        .margin,
        .inputarea.ime-input {
            background-color: ${gray3};

            transition: 200ms cubic-bezier(0.3, 0, 0.5, 1);
            transition-property: background-color;
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

export const FormEditor = React.forwardRef<HTMLDivElement, FormEditorProps>(
    ({ id, defaultValue, value, flat, autoFocus, height = '200px', onChange }, ref) => {
        // const monaco = useMonaco();
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
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [autoFocus, monacoEditorRef.current]);

        return (
            <StyledEditor id={id} flat={flat} ref={ref}>
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
