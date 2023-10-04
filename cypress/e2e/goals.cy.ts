import '../support';
import {
    createSelectButton,
    createGoalItem,
    goalCreateForm,
    goalCancelButton,
    goalTitleInput,
    goalDescriptionInput,
    usersCombobox,
    projectsCombobox,
    priorityCombobox,
    estimateCombobox,
    stateCombobox,
    goalActionCreateOnly,
    comboboxItem,
    projectListItemTitle,
    pageTitle,
    createFastButton,
    comboboxInput,
    createActionToggle,
    goalActionCreateAndGo,
    issuePageHeaderParent,
    issuePageHeaderTitle,
    goalActionCreateOneMore,
    filtersPanelResetButton,
} from '../../src/utils/domObjects';
import { keyPredictor } from '../../src/utils/keyPredictor';
import { exactUrl } from '../helpers';
import { routes } from '../../src/hooks/router';

const testUser = {
    name: 'Test user 1',
    email: 'user1@taskany.org',
    password: 'password',
    provider: 'provider1',
};
const lowPriority = 'Low';
const testProjectForGoals = 'my awesome test project';
const projectKey = keyPredictor(testProjectForGoals);
const testGoalTitle = 'my awesome test goal title';
const testGoalDescription = 'my awesome test goal description';

before(() => {
    cy.task('db:create:user', testUser).then((u: any) => {
        Cypress.env('testUser', u);
    });
    cy.task('db:create:project', {
        title: testProjectForGoals,
        key: projectKey,
        ownerEmail: Cypress.env('ADMIN_EMAIL'),
    }).then((p: any) => {
        Cypress.env('stubProject', p.id);
    });
});

after(() => {
    cy.task('db:remove:user', { id: Cypress.env('testUser').id });
    cy.task('db:remove:project', { id: Cypress.env('stubProject') });
});

describe('Goals', () => {
    beforeEach(() => {
        cy.signInViaEmail();
    });

    describe('create', () => {
        describe('ways to open dialog', () => {
            it('should open then close by hotkeys', () => {
                cy.wait(50).realPress('C').realPress('G');

                cy.get(goalCreateForm.query).should('exist').and('be.visible');

                cy.realPress('Escape');

                cy.get(goalCreateForm.query).should('not.exist');
            });

            it('should open then close dialog via create menu', () => {
                cy.get(createSelectButton.query).click();
                cy.get(createGoalItem.query).click();

                cy.get(goalCreateForm.query).should('exist').and('be.visible');

                cy.get(goalCancelButton.query).should('be.visible').click();
                cy.get(goalCreateForm.query).should('not.exist');
            });

            it('should open via fast button', () => {
                cy.get(createFastButton.query).click();
                cy.get(goalCreateForm.query).should('exist').and('be.visible');
                cy.get(goalCancelButton.query).should('be.visible').click();
                cy.get(goalCreateForm.query).should('not.exist');
            });
        });

        describe('form manipulation data', () => {
            beforeEach(() => {
                cy.get(createFastButton.query).click();
                cy.get(goalCreateForm.query).should('exist').and('be.visible');
            });

            it('should have clean fields', (done) => {
                cy.get(goalTitleInput.query).should('have.value', '');
                cy.get(goalDescriptionInput.query).should('have.value', '');
                cy.get(projectsCombobox.query).should('have.value', '');
                cy.get(priorityCombobox.query).contains(Cypress.env('defaultPriority'));
                cy.get(estimateCombobox.query).should('have.text', '');
                cy.get(stateCombobox.query).should('be.disabled');
                cy.get(goalActionCreateOnly.query).should('be.enabled').contains('Create only');
                cy.get(usersCombobox.query)
                    .should('exist')
                    .then(($el) => {
                        expect($el.text()).oneOf([
                            Cypress.env('currentUser').user.email,
                            Cypress.env('currentUser').user.name,
                            Cypress.env('currentUser').user.nickname,
                        ]);

                        done();
                    });
            });

            it('state control is enabled after choose project', () => {
                cy.get(projectsCombobox.query).should('have.value', '').click();
                cy.get(comboboxInput.query).should('have.value', '');
                cy.get(comboboxInput.query).type(testProjectForGoals);
                cy.get(comboboxItem.query).click();
                cy.get(projectsCombobox.query).contains(projectKey);
                cy.get(stateCombobox.query).should('be.enabled').and('have.text', 'Draft');
            });
            it('can change priority value', () => {
                cy.get(priorityCombobox.query).should('have.text', Cypress.env('defaultPriority')).click();
                cy.get(comboboxItem.query).should('have.length', 4).filter(`:contains(${lowPriority})`).click();
                cy.get(priorityCombobox.query).contains(`${lowPriority}`);
            });

            // TODO: https://github.com/taskany-inc/issues/issues/1746
            it.skip('can set estimate', () => {
                cy.get(estimateCombobox.query).should('have.text', '').click();
                cy.get(estimateCombobox.query).should('have.text', '2023');
            });

            // TODO: https://github.com/taskany-inc/issues/issues/1746
            describe.skip('goal tags', () => {
                it('create and set', () => {});
                it('select in early created', () => {});
            });

            it('can choose the other user', (done) => {
                cy.get(usersCombobox.query).should('exist').click();
                cy.get(comboboxInput.query).clear().type(testUser.name);
                cy.get(comboboxItem.query)
                    .should('contain.text', testUser.name)
                    .and('contain.text', testUser.email)
                    .click();
                cy.get(usersCombobox.query)
                    .should('exist')
                    .then(($el) => {
                        expect($el.text()).oneOf([
                            Cypress.env('testUser').email,
                            Cypress.env('testUser').name,
                            Cypress.env('testUser').nickname,
                        ]);

                        done();
                    });
            });
        });

        describe('with prefilled data', () => {
            it('current project from project page', () => {
                cy.get(filtersPanelResetButton.query).should('exist').click().should('not.exist');
                cy.get(projectListItemTitle.query)
                    .filter(`:contains(${testProjectForGoals})`)
                    // `force: true` because anchor element has zeros dimension
                    .click({ force: true });
                cy.get(pageTitle.query).should('contain', testProjectForGoals);
                cy.url().should('equal', exactUrl(routes.project(projectKey)));
                cy.get(createSelectButton.query).click();
                cy.get(createGoalItem.query).click();
                cy.get(goalCreateForm.query).should('exist').and('be.visible');
                cy.get(projectsCombobox.query).contains(projectKey);
                cy.get(stateCombobox.query).should('be.enabled').and('have.text', 'Draft');
                cy.get(priorityCombobox.query).contains(Cypress.env('defaultPriority'));
            });
        });

        describe('next action behavior', () => {
            beforeEach(() => {
                cy.intercept('/api/trpc/goal.create?*', (req) => {
                    req.on('after:response', (res) => {
                        Cypress.env('createdGoal', res.body[0].result.data.json);
                    });
                }).as('lastCreatedGoal');
                cy.intercept('/_next/data/**/*.json?*').as('goalPage');
                cy.get(createFastButton.query).click();
                cy.get(goalCreateForm.query).should('exist').and('be.visible');
                cy.get(goalTitleInput.query).type(testGoalTitle);
                cy.get(goalDescriptionInput.query).type(testGoalDescription);
                cy.get(projectsCombobox.query).click();
                cy.get(comboboxInput.query).type(testProjectForGoals.slice(0, 4));
                cy.get(comboboxItem.query).click();
                cy.get(projectsCombobox.query).contains(projectKey);
                cy.get(stateCombobox.query).should('be.enabled').and('have.text', 'Draft');
            });

            afterEach(() => {
                cy.task('db:remove:goal', Cypress.env('createdGoal'));
            });

            it('create and create on more', () => {
                cy.get(createActionToggle.query).should('exist').and('be.enabled').click();
                cy.get(goalActionCreateOneMore.query).should('exist').and('be.visible').click();
                cy.get(goalActionCreateOneMore.query).should('be.enabled').click();

                cy.wait('@lastCreatedGoal');

                cy.get(goalCreateForm.query).should('exist').and('be.visible');
                cy.get(projectsCombobox.query).contains(projectKey);
                cy.get(stateCombobox.query).should('be.enabled').and('have.text', 'Draft');
                cy.get(priorityCombobox.query).contains(Cypress.env('defaultPriority'));
                cy.get(goalTitleInput.query).should('have.value', '');
                cy.get(goalDescriptionInput.query).should('have.value', '');
                cy.get(goalActionCreateOneMore.query).should('be.enabled');
            });

            it('create only and immedialty close', (done) => {
                cy.get(goalActionCreateOnly.query).should('exist').and('be.visible').click();

                cy.wait('@lastCreatedGoal');

                cy.get(goalCreateForm.query).should('not.exist');

                cy.getAllLocalStorage().then((res) => {
                    expect(res[Cypress.config('baseUrl')]).have.property('goalCreateFormAction', '3');
                    expect(res[Cypress.config('baseUrl')])
                        .have.property('lastProjectCache')
                        .to.be.a('string')
                        .that.includes(testProjectForGoals);

                    expect(res[Cypress.config('baseUrl')])
                        .have.property('lastProjectCache')
                        .to.be.a('string')
                        .that.includes(projectKey);

                    expect(res[Cypress.config('baseUrl')])
                        .have.property('lastProjectCache')
                        .to.be.a('string')
                        .that.includes('flowId');

                    done();
                });
            });

            it('create and go to goal page', () => {
                cy.get(createActionToggle.query).should('exist').and('be.enabled').click();
                cy.get(goalActionCreateAndGo.query).should('exist').and('be.visible').click();
                cy.get(goalActionCreateAndGo.query).should('be.enabled').click();

                cy.wait(['@lastCreatedGoal', '@goalPage']);

                cy.get(issuePageHeaderParent.query, { timeout: 5000 }).contains(testProjectForGoals);
                cy.get(issuePageHeaderTitle.query).contains(testGoalTitle);
            });
        });

        // TODO: https://github.com/taskany-inc/issues/issues/1746
        describe.skip('correct data on goal page after create', () => {});
    });
});
