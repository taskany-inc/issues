export {};
declare global {
    namespace Cypress {
        interface Chainable {
            signInViaEmail(): Chainable<void>;
            exactUrl(relativeUrl: string): Chainable<void>;
        }
    }
}
