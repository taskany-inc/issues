import '../support';

describe('Auth', () => {
    it('sign in with email credentials as default admin', () => {
        cy.signInViaEmail();
    });
});
