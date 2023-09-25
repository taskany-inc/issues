export {};

type SignIn = {
    email: string;
    password: string;
};

type CreateProjectFields = {
    title: string;
    description?: string;
};
declare global {
    namespace Cypress {
        interface Chainable {
            signInViaEmail(fields?: SignIn): Chainable<void>;
            createProject(fields: CreateProjectFields): Chainable<void>;
        }
    }
}
