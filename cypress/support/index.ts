import 'cypress-real-events';

import { exactUrl } from '../helpers';
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
} from '../../src/utils/domObjects';
import { keyPredictor } from '../../src/utils/keyPredictor';
import { CreateProjectFields, SignIn, CreateGoalFields, GoalFields } from '..';

Cypress.Commands.addAll({
    signInViaEmail: (fields?: SignIn) => {
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

    createProject: (fields: CreateProjectFields) => {
        cy.visit(routes.index());
        cy.get(createSelectButton.query).click();
        cy.get(createProjectItem.query).click();
        cy.get(projectTitleInput.query).type(fields.title);

        if (fields.description) {
            cy.get(projectDescriptionInput.query).type(fields.description);
        }

        cy.get(projectKeyPredictor.query).contains(keyPredictor(fields.title));
        cy.get(projectSubmitButton.query).click();
    },

    createGoal: (fields: CreateGoalFields) => {
        cy.intercept('/api/trpc/goal.create?*').as('createGoalRequest');

        cy.get(createFastButton.query).click();
        cy.get(goalForm.query).should('exist').and('be.visible');
        cy.get(goalTitleInput.query).type(fields.title);
        cy.get(goalDescriptionInput.query).type(fields.description);
        cy.get(projectsCombobox.query).click();
        cy.get(comboboxInput.query).type(fields.projectTitle.slice(0, 4));
        cy.get(comboboxItem.query).click();

        cy.get(projectsCombobox.query).contains(keyPredictor(fields.projectTitle));

        cy.wait(50);
        cy.get(goalActionCreateOnly.query).click();

        cy.wait('@createGoalRequest')
            .its('response')
            .then((res) => {
                const createdGoal = res.body[0].result.data;

                Cypress.env('createdGoal', createdGoal);
                cy.wrap(createdGoal).as('createdGoal');
            });
    },

    updateGoal: (shortId: string, fields: GoalFields) => {
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

                if (createdGoal._shortId === shortId) {
                    Cypress.env('createdGoal', null);
                }
            });
        }).as('deleteGoal');

        cy.get(goalPageDeleteButton.query).should('exist').and('be.visible').click();
        cy.get(goalDeleteShortIdInput.query).type(shortId);
        cy.get(goalDeleteSubmitButton.query).click();
    },
});
