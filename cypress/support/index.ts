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
} from '../../src/utils/domObjects';
import { keyPredictor } from '../../src/utils/keyPredictor';

type SignIn = {
    email: string;
    password: string;
};

type CreateProjectFields = {
    title: string;
    description: string;
};

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
});
