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
    projectListItemTitle,
    projectListItem,
    createGoalInlineControl,
    goalForm,
    filtersPanelResetButton,
    projectsCombobox,
    filtersPanelTitle,
    dashboardLoadMore,
    goalTableList,
} from '../../src/utils/domObjects';
import { exactUrl } from '../helpers';
import { routes } from '../../src/hooks/router';
import { keyPredictor } from '../../src/utils/keyPredictor';

const testProjectTitle = 'Test project title in e2e';
const testProjectDescription = 'Test project description in e2e';
const testProjectKey = keyPredictor(testProjectTitle);
const customKey = 'CUSTOMKEY';
const fifthProjectForTest = 'Fifth project';
const fifthProjectKey = keyPredictor(fifthProjectForTest);
const sixthProjectForTest = 'Sixth project';
const sixthProjectKey = keyPredictor(sixthProjectForTest);

const testProjectTitleRu = 'Тестовый проект';
const testProjectKeyRu = keyPredictor(testProjectTitleRu);
const customKeyRu = 'КАСТОМНЫЙ КЛЮЧ РУ';
const customKeyRuPredict = keyPredictor(customKeyRu, { allowVowels: true });

before(() => {
    cy.loadLangFile();
});

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
                cy.get(projectKeyPredictor.query).contains(testProjectKey).trigger('mouseover');

                cy.get(projectKeyPredictorError.query).should('exist');
                // screenshot

                cy.get(projectSubmitButton.query).click();

                cy.get(projectCreateForm.query).should('exist');
                cy.url().should('equal', exactUrl(routes.index()));
                // screenshot
            });

            describe('create project in Russian', () => {
                it('should create project with recommended key', () => {
                    cy.get(projectTitleInput.query).type(testProjectTitleRu);
                    cy.get(projectKeyPredictor.query).contains(testProjectKeyRu).trigger('mouseover');

                    cy.get(projectKeyPredictorHint.query).should('contain.text', `#${testProjectKeyRu}-42`);
                    cy.get(projectKeyPredictorHint.query).should('contain.text', `#${testProjectKeyRu}-911`);

                    cy.get(projectSubmitButton.query).click();

                    cy.url().should('equal', exactUrl(routes.project(testProjectKeyRu)));
                    cy.get(projectCreateForm.query).should('not.exist');
                });

                it('should create project with custom key', () => {
                    cy.get(projectTitleInput.query).type(testProjectTitleRu);
                    cy.get(projectKeyPredictor.query).click();

                    cy.get(projectKeyPredictorError.query).should('exist');

                    cy.get(projectKeyPredictorInput.query).clear();
                    cy.get(projectKeyPredictorInput.query).type(customKeyRu);

                    cy.get(projectKeyPredictorHint.query).should('contain.text', `#${customKeyRuPredict}-42`);
                    cy.get(projectKeyPredictorHint.query).should('contain.text', `#${customKeyRuPredict}-911`);

                    cy.get(projectSubmitButton.query).click();

                    cy.url().should('equal', exactUrl(routes.project(customKeyRuPredict)));
                    cy.get(projectCreateForm.query).should('not.exist');
                });

                it('not allows to create project with too short title', () => {
                    cy.get(projectTitleInput.query).type('Тес');
                    cy.get(projectKeyPredictor.query).trigger('mouseover');

                    cy.get(projectKeyPredictorError.query).should('exist');

                    cy.get(projectSubmitButton.query).click();

                    cy.get(projectCreateForm.query).should('exist');
                    cy.url().should('equal', exactUrl(routes.index()));
                });

                it('not allows to create project with existing key', () => {
                    cy.get(projectTitleInput.query).type(testProjectTitleRu);
                    cy.get(projectKeyPredictor.query).contains(testProjectKeyRu).trigger('mouseover');

                    cy.get(projectKeyPredictorError.query).should('exist');

                    cy.get(projectSubmitButton.query).click();

                    cy.get(projectCreateForm.query).should('exist');
                    cy.url().should('equal', exactUrl(routes.index()));
                });
            });
        });
    });

    describe('project page', () => {
        before(() => {
            cy.task('db:create:project', {
                title: fifthProjectForTest,
                key: fifthProjectKey,
                ownerEmail: Cypress.env('ADMIN_EMAIL'),
            }).then((p) => {
                Cypress.env('fifthProject', p);
            });
            cy.task('db:create:project', {
                title: sixthProjectForTest,
                key: sixthProjectKey,
                ownerEmail: Cypress.env('ADMIN_EMAIL'),
            }).then((p) => {
                Cypress.env('sixthProject', p);
            });
        });

        after(() => {
            cy.task('db:remove:project', { id: Cypress.env('sixthProject') });
            cy.task('db:remove:project', { id: Cypress.env('fifthProject') });
        });

        beforeEach(() => {
            cy.intercept('/api/trpc/v2.project.getUserDashboardProjects*').as('dashboardLoad');
            cy.get(filtersPanelResetButton.query).should('exist').click();
            cy.get(projectListItem.query).should('exist').and('have.length.greaterThan', 1);
            cy.get(projectListItemTitle.query).should('contain.text', testProjectTitle);
            cy.get(dashboardLoadMore.query).click();

            cy.wait('@dashboardLoad');

            cy.get(`[href="${routes.project(testProjectKey)}"]`).should('exist');
            cy.visit(exactUrl(routes.project(testProjectKey)));
            // wait for correct page
            cy.get(filtersPanelTitle.query).should('contain', testProjectTitle);
            cy.url().should('equal', exactUrl(routes.project(testProjectKey)));
        });

        it('should visible create goal control', () => {
            cy.get(createGoalInlineControl.query).should('exist').click();
            cy.get(goalForm.query).should('exist').and('be.visible');
            cy.get(projectsCombobox.query).contains(testProjectTitle);
        });
    });
});

describe('Personal project', () => {
    const testUser = {
        name: 'Test user 1',
        email: 'user1@taskany.org',
        password: 'password',
        provider: 'provider1',
    };

    const testUser2 = {
        name: 'Test user 2',
        email: 'user2@taskany.org',
        password: 'password',
        provider: 'provider2',
    };

    before(() => {
        cy.task('db:create:user', testUser).then((u) => {
            Cypress.env('testUser', u);
        });
        cy.task('db:create:user', testUser2).then((u) => {
            Cypress.env('testUser2', u);
        });
    });

    after(() => {
        cy.task('db:remove:user', Cypress.env('testUser'));
        cy.task('db:remove:user', Cypress.env('testUser2'));
    });

    beforeEach(() => {
        cy.interceptWhatsNew();
        cy.intercept('/api/trpc/*v2.project.getUserDashboardProjects*?*').as('userDashboard');
        cy.intercept('/api/trpc/*v2.project.getProjectGoalsById*?*').as('goalsByProject');
        cy.signInViaEmail(testUser);
        cy.wait('@whatsnew.check');
        // @ts-ignore
        cy.createPersonalGoal({
            title: 'Personal test goal',
            description: 'Personal test goal description',
            mode: 'personal',
        });
    });

    it('should be able on personal dashboard', () => {
        cy.wait(['@userDashboard', '@goalsByProject']);

        cy.get(projectListItem.query)
            .should('exist')
            .get(projectListItemTitle.query)
            .should('include.text', testUser.name);

        cy.get(projectListItem.query)
            .get(goalTableList.query)
            .should('have.length.gt', 0)
            .and('contain.text', 'Personal test goal');
        cy.logout();

        cy.signInViaEmail(testUser2);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        cy.visit(routes.project(Cypress.env('createdGoal')!.projectId as string), {
            failOnStatusCode: false,
        });
        cy.get('body').should('contain.text', '404');

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        cy.visit(routes.goal(Cypress.env('createdGoal')!._shortId as string), {
            failOnStatusCode: false,
        });
        cy.get('body').should('contain.text', '404');
    });
});
