import 'cypress-real-events';

import { exactUrl } from '../helpers';
import { routes } from '../../src/hooks/router';

Cypress.Commands.addAll({
    signInViaEmail: () => {
        cy.visit(routes.index());
        cy.url().should('equal', exactUrl(routes.signIn()));
        cy.get('input[name=email]').type(Cypress.env('ADMIN_EMAIL'));
        cy.get('input[name=password]').type(`${Cypress.env('ADMIN_PASSWORD')}{enter}`);
        cy.url().should('equal', exactUrl(routes.index()));
    },
});
