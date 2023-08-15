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
                /**
                 * This is magic waiting.
                 * If you press hokeys immediately nothing will happen.
                 */
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
                cy.get(projectCreateForm.query).matchImage({
                    title: 'emptyForm',
                    screenshotConfig: { padding: 40 },
                });
            });

            it('should create project with recommended key', () => {
                cy.get(projectTitleInput.query).type(testProjectTitle);
                cy.get(projectDescriptionInput.query).type(testProjectDescription);
                cy.get(projectKeyPredictor.query).contains(testProjectKey).trigger('mouseover');

                cy.get(projectKeyPredictorHint.query).should('contain.text', `#${testProjectKey}-42`);
                cy.get(projectKeyPredictorHint.query).should('contain.text', `#${testProjectKey}-911`);
                cy.get(projectCreateForm.query).matchImage({
                    title: 'keyPredictorHint',
                    screenshotConfig: { padding: 40 },
                });

                cy.get(projectSubmitButton.query).click();

                cy.exactUrl(routes.project(testProjectKey));
                cy.get(projectCreateForm.query).should('not.exist');
            });

            it('should create project with custom key', () => {
                cy.get(projectTitleInput.query).type(testProjectTitle);
                cy.get(projectDescriptionInput.query).type(testProjectDescription);
                cy.get(projectKeyPredictor.query).click();

                cy.get(projectKeyPredictorError.query).should('exist');
                cy.get(projectCreateForm.query).matchImage({
                    title: 'keyPredictorError',
                    screenshotConfig: { padding: 40 },
                });

                cy.get(projectKeyPredictorInput.query).clear();
                cy.get(projectKeyPredictorInput.query).type(customKey);
                cy.wait(1);
                cy.get(projectKeyPredictorHint.query).should('contain.text', `#${customKey}-42`);
                cy.get(projectKeyPredictorHint.query).should('contain.text', `#${customKey}-911`);
                cy.get(projectCreateForm.query).matchImage({
                    title: 'customKeyHint',
                    screenshotConfig: { padding: 40 },
                });

                cy.get(projectSubmitButton.query).click();

                cy.exactUrl(routes.project(customKey));
                cy.get(projectCreateForm.query).should('not.exist');
            });

            it('not allows to create project with too short title', () => {
                cy.get(projectTitleInput.query).type('Tes');
                cy.get(projectKeyPredictor.query).trigger('mouseover');

                cy.get(projectKeyPredictorError.query).should('exist');
                cy.get(projectCreateForm.query).matchImage({
                    title: 'tooShortTitleError',
                    screenshotConfig: { padding: 40 },
                });

                cy.get(projectSubmitButton.query).click();

                cy.get(projectCreateForm.query).should('exist');
                cy.exactUrl(routes.index());
            });

            it('not allows to create project with existing key', () => {
                cy.get(projectTitleInput.query).type(testProjectTitle);
                cy.get(projectKeyPredictor.query).trigger('mouseover');

                cy.get(projectKeyPredictorError.query).should('exist');
                // FIXME: https://github.com/taskany-inc/issues/issues/1535
                cy.get(projectCreateForm.query).matchImage({
                    title: 'projectAlreadyExistError',
                    screenshotConfig: { padding: 40 },
                });

                // FIXME: https://github.com/taskany-inc/issues/issues/1534
                cy.get(projectSubmitButton.query).click();

                cy.get(projectCreateForm.query).should('exist');
                cy.exactUrl(routes.index());
            });
        });
    });
});
