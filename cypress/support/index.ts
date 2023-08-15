import 'cypress-real-events';
import '@frsource/cypress-plugin-visual-regression-diff';

import { routes } from '../../src/hooks/router';

Cypress.Commands.addAll({
    signInViaEmail: () => {
        cy.visit(routes.index());
        cy.exactUrl(routes.signIn());
        cy.get('input[name=email]').type(Cypress.env('ADMIN_EMAIL'));
        cy.get('input[name=password]').type(`${Cypress.env('ADMIN_PASSWORD')}{enter}`);
        cy.exactUrl(routes.index());
    },
    exactUrl: (relativeUrl: string) => {
        cy.url().should('equal', `${Cypress.config('baseUrl')}${relativeUrl}`);
    },
});
