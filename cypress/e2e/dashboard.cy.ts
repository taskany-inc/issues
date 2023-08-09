const exactUrl = (route: string) => `${Cypress.config('baseUrl')}${route}`;

describe('Dashboard', () => {
    it('asks to sign in on fist visit', () => {
        cy.visit('/');

        cy.url().should('equal', exactUrl('/api/auth/signin'));

        cy.get('input[name=email]').type(Cypress.env('ADMIN_EMAIL'));

        // {enter} causes the form to submit
        cy.get('input[name=password]').type(`${Cypress.env('ADMIN_PASSWORD')}{enter}`);

        cy.url().should('equal', exactUrl('/'));
    });
});
