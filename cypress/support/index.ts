import 'cypress-real-events';

import { exactUrl, getCommentIdQuery } from '../helpers';
import { routes } from '../../src/hooks/router';
import {
    projectTitleInput,
    projectDescriptionInput,
    projectSubmitButton,
    createProjectItem,
    createSelectButton,
    projectKeyPredictor,
    createFastButton,
    goalForm,
    goalTitleInput,
    projectsCombobox,
    goalDescriptionInput,
    comboboxInput,
    comboboxItem,
    goalActionCreateOnly,
    goalPageEditButton,
    goalUpdateButton,
    goalPageDeleteButton,
    goalDeleteShortIdInput,
    goalDeleteSubmitButton,
    commentFormSubmitButton,
    comment,
    commentDropdown,
    commentDropdownEdit,
    commentDropdownDelete,
    userSettingsLogoutButton,
    commentFormDescription,
    pageContent,
    sortPanelDropdownTrigger,
    sortPanel,
    sortPanelEmptyProjectsCheckbox,
    goalPersonalityToggle,
    createPersonalGoalItem,
    estimateCombobox,
    estimateQuarterTrigger,
} from '../../src/utils/domObjects';
import { keyPredictor } from '../../src/utils/keyPredictor';
import { SignInFields } from '..';
import { GoalCommentCreateSchema, GoalCommon, GoalUpdate } from '../../src/schema/goal';
import { CommentEditSchema } from '../../src/schema/comment';
import { ProjectCreate } from '../../src/schema/project';

import { getTranslation } from './lang';

Cypress.Commands.addAll({
    logout: () => {
        cy.visit(routes.userSettings());

        cy.intercept('/api/auth/signout', (req) => {
            req.on('after:response', () => {
                Cypress.env('currentUser', null);
            });
        }).as('signout');

        cy.get(userSettingsLogoutButton.query).should('exist').click();
        cy.wait('@signout');

        cy.clearCookies();
        cy.reload(true);
    },

    interceptWhatsNew: () => {
        cy.intercept('api/trpc/whatsnew.check*', (req) =>
            req.on('response', (res) => {
                if (res.body.result?.data != null && 'version' in res.body.result.data) {
                    res.body.result.data = null;
                }

                res.send();
            }),
        ).as('whatsnew.check');
    },

    signInViaEmail: (fields?: SignInFields) => {
        cy.intercept('/api/auth/session', (req) => {
            req.on('after:response', (res) => {
                Cypress.env('currentUser', res.body);
            });
        }).as('session');

        cy.visit(routes.index());
        cy.url().should('equal', exactUrl(routes.signIn()));
        cy.get('input[name=email]').type(fields?.email || Cypress.env('ADMIN_EMAIL'));
        cy.get('input[name=password]').type(`${fields?.password || Cypress.env('ADMIN_PASSWORD')}{enter}`);
        cy.url().should('equal', exactUrl(routes.index()));

        cy.wait('@session');
    },

    createProject: (fields: ProjectCreate) => {
        cy.intercept('/api/trpc/project.create?*').as('createProjectRequest');
        cy.visit(routes.index());
        cy.get(createSelectButton.query).click();
        cy.get(createProjectItem.query).click();
        cy.get(projectTitleInput.query).type(fields.title);

        if (fields.description) {
            cy.get(projectDescriptionInput.query).type(fields.description);
        }

        cy.get(projectKeyPredictor.query).contains(keyPredictor(fields.title));
        cy.get(projectSubmitButton.query).click();

        cy.wait('@createProjectRequest')
            .its('response')
            .then((res) => {
                cy.wrap(res.body[0].result.data).as('createdProject');
            });
    },

    createGoal: (projectTitle: string, fields: GoalCommon) => {
        cy.intercept('/api/trpc/goal.create?*').as('createGoalRequest');

        cy.get(createFastButton.query).click();
        cy.get(goalForm.query).should('exist').and('be.visible');
        cy.get(goalTitleInput.query).type(fields.title);
        cy.get(goalDescriptionInput.query).type(fields.description);
        cy.get(projectsCombobox.query).click();
        cy.get(comboboxInput.query).type(projectTitle.slice(0, 4));
        cy.get(comboboxItem.query).click();

        cy.get(projectsCombobox.query).contains(projectTitle);

        cy.wait(50);
        cy.get(goalActionCreateOnly.query).should('exist').and('be.visible').and('be.enabled');
        cy.get(goalActionCreateOnly.query).click();

        cy.wait('@createGoalRequest')
            .its('response')
            .then((res) => {
                const createdGoal = res.body[0].result.data;

                Cypress.env('createdGoal', createdGoal);
                cy.wrap(createdGoal).as('createdGoal');
            });
    },

    createPersonalGoal: (fields: GoalCommon) => {
        const translations = getTranslation({
            Dropdown: ['Not chosen'],
            EstimateDropdown: ['Choose quarter'],
        });
        cy.intercept('/api/trpc/*goal.create?*').as('createGoalRequest');
        cy.get(createSelectButton.query).click();
        cy.get(createPersonalGoalItem.query).click();
        cy.get(goalForm.query).should('exist').and('be.visible');
        cy.get(goalTitleInput.query).type(fields.title);
        cy.get(goalDescriptionInput.query).type(fields.description);
        cy.get(goalPersonalityToggle.query).should('exist');
        cy.get(projectsCombobox.query).should('not.exist');

        cy.get(estimateCombobox.query).should('contain.text', translations.Dropdown['Not chosen']()).click();
        cy.get(estimateQuarterTrigger.query)
            .find(`:button:contains(${translations.EstimateDropdown['Choose quarter']()})`)
            .click();

        cy.get(estimateQuarterTrigger.query).children().find(':button:contains(@current)').click();
        cy.get(estimateCombobox.query).should('not.contain.text', translations.Dropdown['Not chosen']()).click();

        cy.get(goalActionCreateOnly.query).should('exist').and('be.visible').and('be.enabled');
        cy.get(goalActionCreateOnly.query).click();

        cy.wait('@createGoalRequest')
            .its('response')
            .then((res) => {
                const createdGoal = res.body[0].result.data;

                Cypress.env('createdGoal', createdGoal);
                cy.wrap(createdGoal).as('createdGoal');
            });
    },

    updateGoal: (shortId: string, fields: GoalUpdate) => {
        cy.visit(routes.goal(shortId));
        cy.intercept('/api/trpc/goal.update?*').as('updateGoal');

        cy.get(goalPageEditButton.query).should('exist').and('be.visible').click();

        if (fields.title) {
            cy.get(goalTitleInput.query).clear().type(fields.title);
        }

        if (fields.description) {
            cy.get(goalDescriptionInput.query).clear().type(fields.description);
        }

        cy.get(goalUpdateButton.query).click();

        cy.wait('@updateGoal')
            .its('response')
            .then((res) => {
                const createdGoal = res.body[0].result.data;

                Cypress.env('createdGoal', createdGoal);
                cy.wrap(createdGoal).as('createdGoal');
            });
    },

    deleteGoal: (shortId: string) => {
        cy.visit(routes.goal(shortId));

        cy.intercept('/api/trpc/goal.toggleArchive?*', (req) => {
            req.on('after:response', (res) => {
                expect(res.statusCode).eq(200);

                const createdGoal = Cypress.env('createdGoal');

                if (createdGoal?._shortId === shortId) {
                    Cypress.env('createdGoal', null);
                }
            });
        }).as('deleteGoal');

        cy.get(goalPageDeleteButton.query).should('exist').and('be.visible').click();
        cy.get(goalDeleteShortIdInput.query).type(shortId);
        cy.get(goalDeleteSubmitButton.query).click();

        cy.wait('@deleteGoal');
    },

    createComment: ({ description }: GoalCommentCreateSchema) => {
        cy.intercept('/api/trpc/goal.createComment?*').as('createCommentRequest');

        cy.get(commentFormDescription.query).should('exist').should('be.visible');
        cy.get(commentFormDescription.query).focus().realType(description);
        cy.get(pageContent.query).scrollTo('bottom');

        cy.get(commentFormSubmitButton.query).should('exist').should('be.visible').click();

        cy.wait('@createCommentRequest')
            .its('response')
            .then((res) => {
                const createdComment = res.body[0].result.data;

                Cypress.env('createdComment', createdComment);
                cy.wrap(createdComment).as('createdComment');
            });
    },
    updateComment: ({ id, description }: CommentEditSchema) => {
        cy.intercept('/api/trpc/goal.updateComment?*').as('updateCommentRequest');

        cy.get(getCommentIdQuery(id, comment.query)).should('exist').should('be.visible');
        cy.get(getCommentIdQuery(id, commentDropdown.query)).click();
        cy.get(getCommentIdQuery(id, commentDropdownEdit.query)).click();

        if (description) {
            cy.get(getCommentIdQuery(id, ` ${commentFormDescription.query}`))
                .should('exist')
                .scrollIntoView()
                .should('be.visible')
                .focus()
                .type('{selectall}{backspace}')
                .realType(description);
        }

        cy.get(getCommentIdQuery(id, ` ${commentFormSubmitButton.query}`))
            .should('exist')
            .should('be.visible')
            .click();

        cy.wait('@updateCommentRequest')
            .its('response')
            .then((res) => {
                const createdComment = res.body[0].result.data;

                Cypress.env('createdComment', createdComment);
                cy.wrap(createdComment).as('createdComment');
            });
    },
    deleteComment: (id: string) => {
        cy.intercept('/api/trpc/goal.deleteComment?*', (req) => {
            req.on('after:response', (res) => {
                expect(res.statusCode).eq(200);

                const createdComment = Cypress.env('createdComment');

                if (createdComment?.id === id) {
                    Cypress.env('createdComment', null);
                }
            });
        }).as('deleteComment');

        cy.get(getCommentIdQuery(id, commentDropdown.query)).click();
        cy.get(getCommentIdQuery(id, commentDropdownDelete.query)).click();

        cy.wait('@deleteComment');
    },
    interceptEditor: () => {
        cy.intercept('**/loader.js').as('loader.js');
        cy.intercept('**/editor.main.js').as('editor.main.js');
        cy.intercept('**/editor.main.css').as('editor.main.css');
        cy.intercept('**/editor.main.nls.js').as('editor.main.nls.js');
        cy.intercept('**/markdown.js').as('markdown.js');
        cy.intercept('**/workerMain.js').as('workerMain.js');
    },
    waitEditor: () => {
        cy.wait([
            '@loader.js',
            '@editor.main.js',
            '@editor.main.css',
            '@editor.main.nls.js',
            '@markdown.js',
            '@workerMain.js',
        ]);
    },
    loadLangFile: () => {
        cy.fixture('langs.json').then((content) => {
            Cypress.env('translations', content);
        });
    },
    getMultipleFields: (selectors: string[]) => {
        const values = {};
        selectors.forEach((selector) => {
            cy.get(selector)
                .invoke('attr', 'value')
                .then((s) => {
                    values[selector] = s;
                });
        });

        return cy.wrap(values);
    },
    hideEmptyProjectOnGoalLists: () => {
        cy.get(sortPanelDropdownTrigger.query).should('exist').click();
        cy.get(sortPanel.query).should('exist').and('be.visible');

        cy.get(sortPanel.query)
            .get(sortPanelEmptyProjectsCheckbox.query)
            .should('be.checked')
            .click()
            .should('not.be.checked');
    },
});

/**
 * with { prevObject: 'element' }
 * ex.: cy.get(sel).callActionForGettingSubject()
 */

Cypress.Commands.addAll(
    { prevSubject: 'element' },
    {
        getTippy: <T extends HTMLElement>(subject: JQuery<T>, text: string) => {
            return cy
                .wrap(subject)
                .realHover()
                .invoke('attr', 'aria-describedby')
                .should('not.be.undefined')
                .then((ttId) => {
                    return cy.get(`#${ttId}`).should('have.text', text);
                });
        },
    },
);
