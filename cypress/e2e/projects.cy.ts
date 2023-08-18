import '../support';
import {
    createProjectItem,
    createSelectButton,
    projectCancelButton,
    projectCreateForm,
    projectDescriptionInput,
    projectKeyPredictor,
    projectKeyPredictorError,
    projectKeyPredictorHint,
    projectKeyPredictorInput,
    projectSubmitButton,
    projectTitleInput,
} from '../../src/utils/domObjects';
import { exactUrl } from '../helpers';
import { routes } from '../../src/hooks/router';
import { keyPredictor } from '../../src/utils/keyPredictor';

const testProjectTitle = 'Test project title in e2e';
const testProjectDescription = 'Test project description in e2e';
const testProjectKey = keyPredictor(testProjectTitle);
const customKey = 'CUSTOMKEY';

describe('Projects', () => {
    beforeEach(() => {
        cy.signInViaEmail();
    });

    describe('create', () => {
        describe('ways to open dialog', () => {
            // NB: no way to test in all locales, but this test runs via keyCode.
            // It means doesn't matter what letter on key. It must work.
            it('should open and close dialog via hotkey', () => {
                cy.wait(50);
                cy.realPress('C').realPress('P');

                cy.get(projectCreateForm.query).should('exist');

                cy.realPress('Escape');

                cy.get(projectCreateForm.query).should('not.exist');
            });

            it('should open and close dialog via create menu', () => {
                cy.get(createSelectButton.query).click();
                cy.get(createProjectItem.query).click();

                cy.get(projectCreateForm.query).should('exist');

                cy.get(projectCancelButton.query).click();

                cy.get(projectCreateForm.query).should('not.exist');
            });
        });

        describe('form data manipulation', () => {
            beforeEach(() => {
                // we are using the simplest way to open dialog before every iteration
                cy.get(createSelectButton.query).click();
                cy.get(createProjectItem.query).click();
            });

            it('should have clean fields', () => {
                cy.get(projectTitleInput.query).should('have.value', '');
                cy.get(projectDescriptionInput.query).should('have.value', '');
                // screenshot
            });

            it('should create project with recommended key', () => {
                cy.get(projectTitleInput.query).type(testProjectTitle);
                cy.get(projectDescriptionInput.query).type(testProjectDescription);
                cy.get(projectKeyPredictor.query).contains(testProjectKey).trigger('mouseover');

                cy.get(projectKeyPredictorHint.query).should('contain.text', `#${testProjectKey}-42`);
                cy.get(projectKeyPredictorHint.query).should('contain.text', `#${testProjectKey}-911`);
                // screenshot

                cy.get(projectSubmitButton.query).click();

                cy.url().should('equal', exactUrl(routes.project(testProjectKey)));
                cy.get(projectCreateForm.query).should('not.exist');
                // screenshot
            });

            it('should create project with custom key', () => {
                cy.get(projectTitleInput.query).type(testProjectTitle);
                cy.get(projectDescriptionInput.query).type(testProjectDescription);
                cy.get(projectKeyPredictor.query).click();

                cy.get(projectKeyPredictorError.query).should('exist');
                // screenshot

                cy.get(projectKeyPredictorInput.query).clear();
                cy.get(projectKeyPredictorInput.query).type(customKey);
                cy.wait(1);
                cy.get(projectKeyPredictorHint.query).should('contain.text', `#${customKey}-42`);
                cy.get(projectKeyPredictorHint.query).should('contain.text', `#${customKey}-911`);
                // screenshot

                cy.get(projectSubmitButton.query).click();

                cy.url().should('equal', exactUrl(routes.project(customKey)));
                cy.get(projectCreateForm.query).should('not.exist');
                // screenshot
            });

            it('not allows to create project with too short title', () => {
                cy.get(projectTitleInput.query).type('Tes');
                cy.get(projectKeyPredictor.query).trigger('mouseover');

                cy.get(projectKeyPredictorError.query).should('exist');
                // screenshot

                cy.get(projectSubmitButton.query).click();

                cy.get(projectCreateForm.query).should('exist');
                cy.url().should('equal', exactUrl(routes.index()));
                // check field error
                // screenshot
            });

            it('not allows to create project with existing key', () => {
                cy.get(projectTitleInput.query).type(testProjectTitle);
                cy.get(projectKeyPredictor.query).trigger('mouseover');

                cy.get(projectKeyPredictorError.query).should('exist');
                // incorrect info in error
                // screenshot

                cy.get(projectSubmitButton.query).click();

                cy.get(projectCreateForm.query).should('exist');
                cy.url().should('equal', exactUrl(routes.index()));
                // screenshot
            });
        });
    });
});