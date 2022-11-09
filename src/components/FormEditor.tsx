/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/display-name */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { FieldError } from 'react-hook-form';
import styled, { css } from 'styled-components';

import { danger10, gray2, gray3, gray6, radiusS, textColor } from '../design/@generated/themes';
import { nullable } from '../utils/nullable';
import { useKeyboard, KeyCode } from '../hooks/useKeyboard';
import { useMounted } from '../hooks/useMounted';

import { Popup } from './Popup';

const Editor = dynamic(() => import('@monaco-editor/react'));

interface FormEditorProps {
    id?: string;
    name?: string;
    value?: string;
    autoFocus?: boolean;
    flat?: 'top' | 'bottom' | 'both';
    height?: string;
    placeholder?: string;
    error?: FieldError;

    onChange?: (value: string | undefined) => void;
    onBlur?: () => void;
    onFocus?: () => void;
    onCancel?: () => void;
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
    z-index: 100;

    pointer-events: none;

    font-size: ${defaultOptions.fontSize}px;
    color: ${gray6};
`;

const StyledErrorTrigger = styled.div`
    position: absolute;
    width: 6px;
    height: 6px;
    border-radius: 100%;
    background-color: ${danger10};
    top: 45%;
    left: -2px;
    z-index: 2;
`;

export const FormEditor = React.forwardRef<HTMLDivElement, FormEditorProps>(
    (
        { id, value, flat, autoFocus, height = '200px', placeholder, error, onChange, onFocus, onBlur, onCancel },
        ref,
    ) => {
        const [focused, setFocused] = useState(false);
        const monacoEditorRef = useRef<any>(null);
        const extraRef = useRef<HTMLDivElement>(null);
        const [viewValue, setViewValue] = useState<string | undefined>('');
        const [popupVisible, setPopupVisibility] = useState(false);
        const popupRef = useRef<HTMLDivElement>(null);
        const mounted = useMounted();

        const handleEditorDidMount = (editor: any /* IStandaloneEditor */) => {
            monacoEditorRef.current = editor;

            if (autoFocus) {
                editor.focus();
                setFocused(true);
                onFocus && onFocus();

                if (viewValue !== value) {
                    editor.trigger('keyboard', 'type', { text: value });
                }
            } else {
                setViewValue(value);
            }
        };

        useEffect(() => {
            if (mounted && viewValue !== value) setViewValue(value);
        }, [value, viewValue, mounted]);

        useEffect(() => {
            if (autoFocus) {
                monacoEditorRef.current?.focus();
                setFocused(true);
                onFocus && onFocus();
                monacoEditorRef.current?.setPosition(monacoEditorRef.current?.getPosition());
            }
        }, [autoFocus, onFocus, viewValue, value]);

        const onEditorFocus = useCallback(() => {
            setFocused(true);
            error && setPopupVisibility(true);
            onFocus && onFocus();
        }, [onFocus, error]);

        const onEditorBlur = useCallback(() => {
            setFocused(false);
            error && setPopupVisibility(false);
            onBlur && onBlur();
        }, [onBlur, error]);

        const [onESC] = useKeyboard([KeyCode.Escape], () => {
            onEditorBlur();

            extraRef.current?.focus();
            extraRef.current?.blur();

            onCancel && onCancel();
        });

        const onClickOutside = useCallback(() => setPopupVisibility(false), [setPopupVisibility]);

        return (
            <div tabIndex={0} ref={extraRef} style={{ outline: 'none' }}>
                <StyledEditor tabIndex={0} id={id} flat={flat} ref={ref} {...onESC}>
                    {nullable(error, (err) => (
                        <>
                            <StyledErrorTrigger
                                ref={popupRef}
                                onMouseEnter={() => setPopupVisibility(true)}
                                onMouseLeave={() => setPopupVisibility(false)}
                            />
                            <Popup
                                tooltip
                                view="danger"
                                placement="top-start"
                                visible={popupVisible}
                                onClickOutside={onClickOutside}
                                reference={popupRef}
                            >
                                {err.message}
                            </Popup>
                        </>
                    ))}

                    {nullable(!focused && !value && placeholder, () => (
                        <StyledPlaceholder>{placeholder}</StyledPlaceholder>
                    ))}

                    <div onFocus={onEditorFocus} onBlur={onEditorBlur}>
                        <Editor
                            loading=""
                            theme="vs-dark"
                            height={height}
                            defaultLanguage="markdown"
                            value={viewValue}
                            options={defaultOptions}
                            onChange={onChange}
                            onMount={handleEditorDidMount}
                        />
                    </div>
                </StyledEditor>
            </div>
        );
    },
);
