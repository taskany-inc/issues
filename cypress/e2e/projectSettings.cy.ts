import '../support';
import {
    pageTabs,
    projectSettingsCancelDeleteProjectButton,
    projectSettingsCancelTransferProjectButton,
    projectSettingsConfirmDeleteProjectButton,
    projectSettingsConfirmTransferProjectButton,
    projectSettingsDeleteProjectButton,
    projectSettingsDeleteProjectInput,
    projectSettingsDescriptionInput,
    projectSettingsParentMultiInput,
    projectSettingsParentMultiInputTagClean,
    projectSettingsParentMultiInputTrigger,
    projectSettingsSaveButton,
    projectSettingsTitleInput,
    projectSettingsTransferProjectButton,
    projectSettingsTransferProjectKeyInput,
    projectSettingsTransferProjectOwnerButton,
} from '../../src/utils/domObjects';
import { routes } from '../../src/hooks/router';
import { keyPredictor } from '../../src/utils/keyPredictor';
import { exactUrl } from '../helpers';

const userEmail = 'user@taskany.org';
const userPassword = 'taskany';

const title = 'Project Title';
const description = 'Project Description';
const id = keyPredictor(title);

const titleParentOne = 'Cypress Flow';
const titleParentTwo = 'Cypress Sync';

const addedText = 'smth';
const popupAttribute = '[data-tippy-root]';

describe('ProjectSettings', () => {
    before(() => {
        cy.task('db:create:project', {
            title,
            description,
            ownerEmail: Cypress.env('ADMIN_EMAIL'),
            key: keyPredictor(title),
        });
        cy.task('db:create:project', {
            title: titleParentOne,
            ownerEmail: Cypress.env('ADMIN_EMAIL'),
            key: keyPredictor(titleParentOne),
        });
        cy.task('db:create:project', {
            title: titleParentTwo,
            ownerEmail: Cypress.env('ADMIN_EMAIL'),
            key: keyPredictor(titleParentTwo),
        });
    });

    after(() => {
        cy.task('db:remove:project', { id: keyPredictor(title) });
        cy.task('db:remove:project', { id: keyPredictor(titleParentOne) });
        cy.task('db:remove:project', { id: keyPredictor(titleParentTwo) });
    });

    beforeEach(() => {
        cy.intercept('/api/trpc/project.update*').as('updateProject');
        cy.signInViaEmail();
        cy.visit(routes.projectSettings(id));
    });

    describe('save button must be active if anything was changed', () => {
        it('change title', () => {
            cy.get(projectSettingsSaveButton.query).should('be.disabled');

            cy.get(projectSettingsTitleInput.query).type(addedText);
            cy.get(projectSettingsSaveButton.query).should('be.not.disabled');

            cy.get(projectSettingsTitleInput.query).clear().type(title);
            cy.get(projectSettingsSaveButton.query).should('be.disabled');
        });

        it('change description', () => {
            cy.get(projectSettingsSaveButton.query).should('be.disabled');

            cy.get(projectSettingsDescriptionInput.query).type(addedText);
            cy.get(projectSettingsSaveButton.query).should('be.not.disabled');

            cy.get(projectSettingsDescriptionInput.query).clear().type(description);
            cy.get(projectSettingsSaveButton.query).should('be.disabled');
        });

        it('add parent', () => {
            cy.get(projectSettingsSaveButton.query).should('be.disabled');

            cy.get(projectSettingsParentMultiInputTrigger.query).click();
            cy.focused().clear().type(titleParentOne);
            cy.get(popupAttribute).contains(titleParentOne).click();

            cy.get(projectSettingsSaveButton.query).should('be.not.disabled');
        });

        it('add some parents', () => {
            cy.get(projectSettingsSaveButton.query).should('be.disabled');

            cy.get(projectSettingsParentMultiInputTrigger.query).click();
            cy.focused().clear().type(titleParentOne);
            cy.get(popupAttribute).contains(titleParentOne).click();

            cy.get(projectSettingsSaveButton.query).should('be.not.disabled');

            cy.get(projectSettingsParentMultiInputTrigger.query).click();
            cy.focused().clear().type(titleParentTwo);
            cy.get(popupAttribute).contains(titleParentTwo).click();

            cy.get(projectSettingsSaveButton.query).should('be.not.disabled');
        });
    });

    describe('change title', () => {
        it('title is filled', () => {
            cy.get(projectSettingsTitleInput.query).type(addedText);

            cy.get(projectSettingsSaveButton.query).click().should('be.disabled');

            cy.visit(routes.projectSettings(id));
            cy.get(projectSettingsTitleInput.query).should('have.value', title + addedText);
        });

        it('return title to default value', () => {
            cy.get(projectSettingsTitleInput.query).clear().type(title);
            cy.get(projectSettingsSaveButton.query).click();
        });

        it('title is empty', () => {
            cy.get(projectSettingsTitleInput.query).clear();

            cy.get(projectSettingsSaveButton.query).click().should('not.be.disabled');
            cy.get(projectSettingsTitleInput.query).should('be.focused');
        });
    });

    describe('change description', () => {
        it('description is filled', () => {
            cy.get(projectSettingsDescriptionInput.query).type(addedText);

            cy.get(projectSettingsSaveButton.query).click().should('be.disabled');

            cy.visit(routes.projectSettings(id));
            cy.get(projectSettingsDescriptionInput.query).should('have.value', description + addedText);
        });

        it('description is empty', () => {
            cy.get(projectSettingsDescriptionInput.query).clear();

            cy.get(projectSettingsSaveButton.query).click().should('be.disabled');

            cy.visit(routes.projectSettings(id));
            cy.get(projectSettingsDescriptionInput.query).should('be.empty');
        });

        it('return description to default value', () => {
            cy.get(projectSettingsDescriptionInput.query).clear().type(description);
            cy.get(projectSettingsSaveButton.query).click();
        });
    });

    describe('add parents', () => {
        it('add one parent', () => {
            cy.get(projectSettingsParentMultiInputTrigger.query).click();
            cy.focused().clear().type(titleParentOne);
            cy.get(popupAttribute).contains(titleParentOne).click();

            cy.get(projectSettingsSaveButton.query).click();
            cy.wait('@updateProject');
            cy.visit(routes.projectSettings(id));

            cy.get(projectSettingsParentMultiInput.query).should('contain.text', titleParentOne);
        });

        it('remove one parent', () => {
            cy.get(projectSettingsParentMultiInputTagClean.query).click();

            cy.get(projectSettingsSaveButton.query).click();
            cy.wait('@updateProject');
            cy.visit(routes.projectSettings(id));

            cy.get(projectSettingsParentMultiInput.query).should('not.contain.text', titleParentOne);
        });

        it('add two parents', () => {
            cy.get(projectSettingsParentMultiInputTrigger.query).click();
            cy.focused().clear().type(titleParentOne);
            cy.get(popupAttribute).contains(titleParentOne).click();

            cy.get(projectSettingsParentMultiInputTrigger.query).click();
            cy.focused().clear().type(titleParentTwo);
            cy.get(popupAttribute).contains(titleParentTwo).click();

            cy.get(projectSettingsSaveButton.query).click();
            cy.wait('@updateProject');
            cy.visit(routes.projectSettings(id));

            cy.get(projectSettingsParentMultiInput.query)
                .should('contain.text', titleParentOne)
                .and('contain.text', titleParentTwo);
        });

        it('remove two parents', () => {
            cy.get(projectSettingsParentMultiInputTagClean.query)
                .should('be.visible')
                .each(($element) => cy.wrap($element).trigger('click'));

            cy.get(projectSettingsSaveButton.query).click();
            cy.wait('@updateProject');
            cy.visit(routes.projectSettings(id));

            cy.get(projectSettingsParentMultiInput.query)
                .should('not.contain.text', titleParentOne)
                .and('not.contain.text', titleParentTwo);
        });
    });

    describe('remove project', () => {
        it('open/close removing project modal', () => {
            cy.get(projectSettingsConfirmDeleteProjectButton.query).should('not.exist');

            cy.get(projectSettingsDeleteProjectButton.query).click();
            cy.get(projectSettingsConfirmDeleteProjectButton.query).should('exist');

            cy.get(projectSettingsCancelDeleteProjectButton.query).click();
            cy.get(projectSettingsConfirmDeleteProjectButton.query).should('not.exist');
        });

        it('cancel removing project', () => {
            cy.get(projectSettingsDeleteProjectButton.query).click();

            cy.get(projectSettingsDeleteProjectInput.query).should('exist');
            cy.get(projectSettingsCancelDeleteProjectButton.query).should('be.not.disabled');

            cy.get(projectSettingsDeleteProjectInput.query).should('be.empty').type(id);
            cy.get(projectSettingsCancelDeleteProjectButton.query).should('be.not.disabled').click();

            cy.get(projectSettingsDeleteProjectInput.query).should('not.exist');
        });

        it('confirm removing project', () => {
            cy.get(projectSettingsDeleteProjectButton.query).click();

            cy.get(projectSettingsDeleteProjectInput.query).should('exist');
            cy.get(projectSettingsCancelDeleteProjectButton.query).should('be.not.disabled');

            cy.get(projectSettingsConfirmDeleteProjectButton.query).should('be.disabled');

            cy.get(projectSettingsDeleteProjectInput.query).type(addedText);
            cy.get(projectSettingsConfirmDeleteProjectButton.query).should('be.disabled');

            cy.get(projectSettingsDeleteProjectInput.query).clear().type(id);
            cy.get(projectSettingsConfirmDeleteProjectButton.query).should('be.not.disabled');
        });
    });

    describe('check routing', () => {
        describe('user is NOT the owner', () => {
            beforeEach(() => {
                cy.clearCookies();
                cy.visit(routes.signIn());
                cy.signInViaEmail({ email: userEmail, password: userPassword });
            });

            it('going via tab from project page', () => {
                cy.visit(routes.project(id));

                cy.get(pageTabs.query)
                    .find(`[href="${routes.projectSettings(id)}"]`)
                    .should('not.exist');
            });

            it('going via exact url from project page', () => {
                cy.visit(routes.projectSettings(id));
                cy.url().should('equal', exactUrl(routes.project(id)));
            });
        });
    });

    describe('transfer project to other user', () => {
        it('open/close transferring project modal', () => {
            cy.get(projectSettingsConfirmTransferProjectButton.query).should('not.exist');

            cy.get(projectSettingsTransferProjectButton.query).click();
            cy.get(projectSettingsConfirmTransferProjectButton.query).should('exist');

            cy.get(projectSettingsCancelTransferProjectButton.query).click();
            cy.get(projectSettingsConfirmTransferProjectButton.query).should('not.exist');
        });

        it('cancel transferring project with only key', () => {
            cy.get(projectSettingsTransferProjectButton.query).click();

            cy.get(projectSettingsCancelTransferProjectButton.query).should('not.be.disabled');
            cy.get(projectSettingsConfirmTransferProjectButton.query).should('be.disabled');

            cy.get(projectSettingsTransferProjectKeyInput.query).type(id);

            cy.get(projectSettingsCancelTransferProjectButton.query).should('not.be.disabled');
            cy.get(projectSettingsConfirmTransferProjectButton.query).should('be.disabled');

            cy.get(projectSettingsCancelTransferProjectButton.query).click();
            cy.get(projectSettingsConfirmTransferProjectButton.query).should('not.exist');
        });

        it('cancel transferring project with key & user', () => {
            cy.get(projectSettingsTransferProjectButton.query).click();

            cy.get(projectSettingsCancelTransferProjectButton.query).should('not.be.disabled');
            cy.get(projectSettingsConfirmTransferProjectButton.query).should('be.disabled');

            cy.get(projectSettingsTransferProjectKeyInput.query).type(id);

            cy.get(projectSettingsCancelTransferProjectButton.query).should('not.be.disabled');
            cy.get(projectSettingsConfirmTransferProjectButton.query).should('be.disabled');

            cy.get(projectSettingsTransferProjectOwnerButton.query).click();
            cy.focused().type(userEmail);
            cy.get(popupAttribute).contains(userEmail).click();

            cy.get(projectSettingsCancelTransferProjectButton.query).should('not.be.disabled');
            cy.get(projectSettingsConfirmTransferProjectButton.query).should('not.be.disabled');

            cy.get(projectSettingsCancelTransferProjectButton.query).click();
            cy.get(projectSettingsConfirmTransferProjectButton.query).should('not.exist');
        });

        it('confirm transferring to other user', () => {
            cy.get(projectSettingsTransferProjectButton.query).click();

            cy.get(projectSettingsCancelTransferProjectButton.query).should('not.be.disabled');
            cy.get(projectSettingsConfirmTransferProjectButton.query).should('be.disabled');

            cy.get(projectSettingsTransferProjectKeyInput.query).type(id);

            cy.get(projectSettingsCancelTransferProjectButton.query).should('not.be.disabled');
            cy.get(projectSettingsConfirmTransferProjectButton.query).should('be.disabled');

            cy.get(projectSettingsTransferProjectOwnerButton.query).click();
            cy.focused().type(userEmail);
            cy.get(popupAttribute).contains(userEmail).click();

            cy.get(projectSettingsCancelTransferProjectButton.query).should('not.be.disabled');
            cy.get(projectSettingsConfirmTransferProjectButton.query).should('not.be.disabled');

            cy.get(projectSettingsConfirmTransferProjectButton.query).click();
        });
    });

    describe('check routing', () => {
        describe('user is the owner', () => {
            beforeEach(() => {
                cy.clearCookies();
                cy.visit(routes.signIn());
                cy.signInViaEmail({ email: userEmail, password: userPassword });
            });

            it('going via tab from project page', () => {
                cy.visit(routes.project(id));

                cy.get(pageTabs.query)
                    .find(`[href="${routes.projectSettings(id)}"]`)
                    .click();
                cy.url().should('equal', exactUrl(routes.projectSettings(id)));
            });

            it('going via exact url from project page', () => {
                cy.visit(routes.projectSettings(id));
                cy.url().should('equal', exactUrl(routes.projectSettings(id)));
            });
        });

        describe('admin is NOT owner', () => {
            it('going via tab from project page', () => {
                cy.visit(routes.project(id));

                cy.get(pageTabs.query)
                    .find(`[href="${routes.projectSettings(id)}"]`)
                    .click();
                cy.url().should('equal', exactUrl(routes.projectSettings(id)));
            });

            it('going via exact url from project page', () => {
                cy.visit(routes.projectSettings(id));
                cy.url().should('equal', exactUrl(routes.projectSettings(id)));
            });
        });
    });
});
