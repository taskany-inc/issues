import { editorLoader } from '@taskany/bricks';
import React, { useCallback } from 'react';
import { FormControlEditor as FormEditor } from '@taskany/bricks/harmony';

import { trpc } from '../../utils/trpcClient';
import { getUserName } from '../../utils/getUserName';
import { routes } from '../../hooks/router';

import { tr } from './FormControlEditor.i18n';

editorLoader.config({
    paths: {
        vs: '/monaco',
    },
});

const triggerCharacter = '@';
const emptySuggestions = { suggestions: [] };

export const FormControlEditor = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof FormEditor>>(
    ({ onMount, ...props }, ref) => {
        const utils = trpc.useContext();

        const onMountCallback = useCallback<NonNullable<React.ComponentProps<typeof FormEditor>['onMount']>>(
            (editor, monaco) => {
                monaco.languages.registerCompletionItemProvider('markdown', {
                    provideCompletionItems: async (model, position) => {
                        const line = model.getValueInRange({
                            startColumn: 0,
                            endColumn: position.column,
                            startLineNumber: position.lineNumber,
                            endLineNumber: position.lineNumber,
                        });

                        if (line.indexOf(triggerCharacter) < 0) {
                            return emptySuggestions;
                        }

                        const query = line.slice(line.lastIndexOf(triggerCharacter) + 1, position.column);

                        if (!query.length) {
                            return emptySuggestions;
                        }

                        const users = await utils.crew.getUsers.fetch({
                            query,
                        });

                        return {
                            suggestions: users.map((user) => {
                                const label = getUserName(user);

                                const startColumn = position.column - query.length;
                                const endColumn = startColumn + label.length;

                                return {
                                    label,
                                    range: {
                                        startColumn,
                                        endColumn,
                                        startLineNumber: position.lineNumber,
                                        endLineNumber: position.lineNumber,
                                    },
                                    insertText: `[${label}](${routes.crewUser(user.id)})`,
                                    kind: monaco.languages.CompletionItemKind.User,
                                    additionalTextEdits: [
                                        {
                                            range: {
                                                startColumn: startColumn - 1,
                                                endColumn: startColumn,
                                                startLineNumber: position.lineNumber,
                                                endLineNumber: position.lineNumber,
                                            },
                                            text: null,
                                        },
                                    ],
                                    filterText: query,
                                };
                            }),
                        };
                    },
                    resolveCompletionItem: (item) => {
                        return item;
                    },
                    triggerCharacters: [triggerCharacter],
                });

                onMount?.(editor, monaco);
            },
            [utils, onMount],
        );

        return (
            <FormEditor
                ref={ref}
                messages={{
                    attachmentsButton: tr('Attach files'),
                    attachmentsDescription: tr("drag'n'drop or pasting also supported"),
                    attachmentsUploading: tr('Uploading...'),
                }}
                onMount={onMountCallback}
                {...props}
            />
        );
    },
);
