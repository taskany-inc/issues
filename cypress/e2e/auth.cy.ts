import { routes } from '../../src/hooks/router';
import '../support';

describe('Auth', () => {
    it('sign in with email credentials as default admin', () => {
        /**
         * We are not using signInViaEmail command here
         * because we want to check view via screenshot.
         */
        cy.visit(routes.index());
        cy.exactUrl(routes.signIn());
        /**
         * This is default page by nextjs.
         * It's impossible to use dom-objects.
         * @see https://github.com/taskany-inc/issues/issues/136
         */
        cy.get('.signin').matchImage({
            title: 'signinForm',
        });

        cy.get('input[name=email]').type(Cypress.env('ADMIN_EMAIL'));
        cy.get('input[name=password]').type(`${Cypress.env('ADMIN_PASSWORD')}{enter}`);
        cy.exactUrl(routes.index());
    });
});
