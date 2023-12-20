import '../support';
import {
    createSelectButton,
    createGoalItem,
    goalForm,
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
    goalPageHeaderParent,
    goalPageHeaderTitle,
    goalActionCreateOneMore,
    filtersPanelResetButton,
    goalPageEditButton,
    goalPageDeleteButton,
    tagsCombobox,
    goalTagList,
    goalTagListItem,
    goalTagListItemClean,
    goalTitleInputError,
    estimateQuarterTrigger,
    estimateQuarterItem,
    estimateYearTrigger,
    estimateStrictDateTrigger,
    estimateYearItem,
    estimateStrictDateInput,
} from '../../src/utils/domObjects';
import { keyPredictor } from '../../src/utils/keyPredictor';
import { exactUrl } from '../helpers';
import { routes } from '../../src/hooks/router';
import { GoalCreateReturnType } from '../../trpc/inferredTypes';
import { getTranslation } from '../support/lang';
import { createLocaleDate, getQuarterFromDate, getYearFromDate } from '../../src/utils/dateTime';
import { Quarters } from '../../src/types/date';

const testUser = {
    name: 'Test user 1',
    email: 'user1@taskany.org',
    password: 'password',
    provider: 'provider1',
};
const testProjectForGoals = 'my awesome test project';
const projectKey = keyPredictor(testProjectForGoals);
const testGoalTitle = 'my awesome test goal title';
const testGoalDescription = 'my awesome test goal description';
const testTag = 'test tag for goal';
const testTagForManualCreate = 'manual tag';

before(() => {
    cy.task('db:create:user', testUser).then((u) => {
        Cypress.env('testUser', u);
    });
    cy.task('db:create:project', {
        title: testProjectForGoals,
        key: projectKey,
        ownerEmail: Cypress.env('ADMIN_EMAIL'),
    }).then((p) => {
        Cypress.env('stubProject', p.id);
    });
    cy.task('db:create:tag', {
        title: testTag,
        userEmail: Cypress.env('ADMIN_EMAIL'),
    }).then((res) => {
        Cypress.env('tag', res);
    });
    cy.loadLangFile();
});

after(() => {
    cy.task('db:remove:user', { id: Cypress.env('testUser').id });
    cy.task('db:remove:project', { id: Cypress.env('stubProject') });
    cy.task('db:remove:tag', { id: Cypress.env('tag').id });
});

describe('Goals', () => {
    describe('create', () => {
        beforeEach(() => {
            cy.intercept('/api/trpc/tag.suggestions?*').as('gettingTags');
            cy.signInViaEmail();
        });

        describe('ways to open dialog', () => {
            it('should open then close by hotkeys', () => {
                cy.wait(50).realPress('C').realPress('G');

                cy.get(goalForm.query).should('exist').and('be.visible');

                cy.realPress('Escape');

                cy.get(goalForm.query).should('not.exist');
            });

            it('should open then close dialog via create menu', () => {
                cy.get(createSelectButton.query).click();
                cy.get(createGoalItem.query).click();

                cy.get(goalForm.query).should('exist').and('be.visible');

                cy.get(goalCancelButton.query).should('be.visible').click();
                cy.get(goalForm.query).should('not.exist');
            });

            it('should open via fast button', () => {
                cy.get(createFastButton.query).click();
                cy.get(goalForm.query).should('exist').and('be.visible');
                cy.get(goalCancelButton.query).should('be.visible').click();
                cy.get(goalForm.query).should('not.exist');
            });
        });

        describe('form manipulation data', () => {
            beforeEach(() => {
                cy.get(createFastButton.query).click();
                cy.get(goalForm.query).should('exist').and('be.visible');
            });

            it('should have clean fields', (done) => {
                const translations = getTranslation({
                    GoalCreateForm: ['Create only'],
                });

                cy.get(goalTitleInput.query).should('have.value', '');
                cy.get(goalDescriptionInput.query).should('have.value', '');
                cy.get(projectsCombobox.query).should('have.value', '');
                cy.get(priorityCombobox.query).contains(Cypress.env('defaultPriority'));
                cy.get(estimateCombobox.query).should('have.text', '');
                cy.get(stateCombobox.query).should('be.disabled');
                cy.get(goalActionCreateOnly.query)
                    .should('be.enabled')
                    .contains(translations.GoalCreateForm['Create only']());
                cy.get(usersCombobox.query)
                    .should('exist')
                    .then(($el) => {
                        expect(
                            [
                                Cypress.env('currentUser').user.email,
                                Cypress.env('currentUser').user.name,
                                Cypress.env('currentUser').user.nickname,
                            ].some((value) => $el.text().includes(value)),
                        ).to.be.true;

                        done();
                    });
            });

            it('should fill the title', () => {
                const translates = getTranslation({
                    schema: [
                        'Title is required',
                        'Title can be 50 symbols maximum',
                        "Goal's title must be longer than 10 symbols",
                    ],
                });
                cy.get(goalTitleInput.query).should('have.value', '');
                cy.get(projectsCombobox.query).should('have.value', '');

                cy.get(goalActionCreateOnly.query).should('exist').and('be.visible').click();

                cy.get(goalTitleInputError.query)
                    .should('exist')
                    .and('be.visible')
                    .getErrorTooltip(translates.schema["Goal's title must be longer than 10 symbols"]());
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
                const translations = getTranslation({
                    PriorityText: ['Low', 'Medium'],
                });

                cy.get(priorityCombobox.query).contains(translations.PriorityText.Medium()).click();
                cy.get(comboboxItem.query)
                    .should('have.length', 4)
                    .filter(`:contains(${translations.PriorityText.Low()})`)
                    .click();
                cy.get(priorityCombobox.query).contains(translations.PriorityText.Low());
            });

            describe('can set estimate', () => {
                const now = new Date();
                const currentYear = getYearFromDate(now);
                const years: string[] = [];
                const quarters = Object.values(Quarters);
                const currentQuarter = getQuarterFromDate(now);
                const currentDate = createLocaleDate(now, { locale: 'en' });

                for (let i = currentYear - 1; i <= currentYear + 4; i++) {
                    years.push(String(i));
                }

                beforeEach(() => {
                    cy.clock(now, ['Date']);

                    cy.get(estimateCombobox.query).should('have.text', '').click();
                    cy.get(estimateYearTrigger.query).should('be.visible');
                    cy.get(estimateQuarterTrigger.query).should('be.visible');
                    cy.get(estimateStrictDateTrigger.query).should('be.visible');
                });

                afterEach(() => {
                    cy.clock().invoke('restore');
                });
                it('set estimate year', () => {
                    cy.get(estimateYearTrigger.query).click();
                    cy.get(estimateYearItem.query)
                        .should('be.visible')
                        .and('be.enabled')
                        .each((el) => {
                            cy.wrap(el).its('[0].innerText').should('be.oneOf', years);
                        });

                    cy.get(estimateCombobox.query).should('have.text', `${currentYear}`).click();
                });
                it('set estimate quarter', () => {
                    cy.get(estimateQuarterTrigger.query).click();
                    cy.get(estimateQuarterItem.query)
                        .should('be.visible')
                        .and('be.enabled')
                        .each((el) => {
                            cy.wrap(el).its('[0].innerText').should('be.oneOf', quarters);
                        });

                    cy.get(estimateCombobox.query).should('have.text', `${currentQuarter}/${currentYear}`).click();
                });

                it('set estimate strict date', () => {
                    cy.get(estimateStrictDateTrigger.query).click();
                    cy.get(estimateStrictDateInput.query)
                        .should('be.visible')
                        .and('be.enabled')
                        .and('have.value', currentDate);

                    cy.get(estimateCombobox.query).should('have.text', currentDate).click();
                });
            });

            describe('goal tags', () => {
                it('select from early created and remove them', () => {
                    cy.get(tagsCombobox.query).click();
                    cy.get(comboboxInput.query).type(testTag.slice(0, 5));

                    cy.wait('@gettingTags');

                    cy.get(comboboxItem.query).should('exist').and('have.length', 1);
                    cy.get(comboboxItem.query).first().contains(Cypress.env('tag').title).click();

                    cy.get(goalTagList.query).should('be.visible').its('[0].children').should('have.length', 1);
                    cy.get(goalTagListItem.query).contains(Cypress.env('tag').title);
                    cy.get(goalTagListItemClean.query).should('exist').and('not.be.visible');

                    cy.get(goalTagListItem.query).first().realHover();
                    cy.get(goalTagListItemClean.query).should('be.visible').click();
                    cy.get(goalTagListItem.query).should('not.exist');
                });
                it.only('create and set', () => {
                    cy.get(tagsCombobox.query).click();
                    cy.get(comboboxInput.query).type(testTagForManualCreate);

                    cy.wait('@gettingTags');

                    cy.get(comboboxItem.query).should('exist').and('have.length', 1);
                    cy.get(comboboxItem.query).first().contains(testTagForManualCreate).click();
                    cy.get(goalTagList.query).should('be.visible').its('[0].children').should('have.length', 1);
                    cy.get(goalTagListItem.query).contains(testTagForManualCreate);
                    cy.get(goalTagListItemClean.query).should('exist').and('not.be.visible');
                });
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
                        expect(
                            [
                                Cypress.env('testUser').email,
                                Cypress.env('testUser').name,
                                Cypress.env('testUser').nickname,
                            ].some((value) => $el.text().includes(value)),
                        ).to.be.true;

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
                cy.get(goalForm.query).should('exist').and('be.visible');
                cy.get(projectsCombobox.query).contains(projectKey);
                cy.get(stateCombobox.query).should('be.enabled').and('have.text', 'Draft');
                cy.get(priorityCombobox.query).contains(Cypress.env('defaultPriority'));
            });
        });

        describe('next action behavior', () => {
            beforeEach(() => {
                cy.intercept('/api/trpc/goal.create?*', (req) => {
                    req.on('after:response', (res) => {
                        Cypress.env('createdGoal', res.body[0].result.data);
                    });
                }).as('lastCreatedGoal');
                cy.intercept('/_next/data/**/*.json?*').as('goalPage');
                cy.get(createFastButton.query).click();
                cy.get(goalForm.query).should('exist').and('be.visible');
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

                cy.get(goalForm.query).should('exist').and('be.visible');
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

                cy.get(goalForm.query).should('not.exist');

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

                cy.get(goalPageHeaderParent.query, { timeout: 5000 }).contains(testProjectForGoals);
                cy.get(goalPageHeaderTitle.query).contains(testGoalTitle);
            });
        });
    });

    describe('modify access', () => {
        afterEach(() => {
            const createdGoal = Cypress.env('createdGoal');

            if (createdGoal) {
                cy.task('db:remove:goal', createdGoal);
            }
        });
        describe('admin', () => {
            it('can create, edit and delete own goal', () => {
                cy.signInViaEmail();

                cy.createGoal(testProjectForGoals, {
                    title: testGoalTitle,
                    description: testGoalDescription,
                }).then((goal) => {
                    const updatedGoalTitle = `${testGoalTitle}_new_title`;

                    cy.updateGoal(goal._shortId, { title: updatedGoalTitle });
                    cy.get(goalPageHeaderTitle.query).contains(updatedGoalTitle);
                    cy.deleteGoal(goal._shortId);
                });
            });

            it('can edit and delete other user`s goals', () => {
                cy.signInViaEmail({ email: testUser.email, password: testUser.password });

                cy.createGoal(testProjectForGoals, {
                    title: testGoalTitle,
                    description: testGoalDescription,
                });

                cy.clearCookies();
                cy.visit(routes.signIn());

                cy.signInViaEmail();

                cy.get<GoalCreateReturnType>('@createdGoal').then((goal) => {
                    const updatedGoalTitle = `${testGoalTitle}_new_title_2`;

                    cy.updateGoal(goal._shortId, { title: updatedGoalTitle });
                    cy.get(goalPageHeaderTitle.query).contains(updatedGoalTitle);
                    cy.deleteGoal(goal._shortId);
                });
            });
        });

        describe('user', () => {
            it('can create, edit and delete own goals', () => {
                cy.signInViaEmail();

                cy.createGoal(testProjectForGoals, {
                    title: testGoalTitle,
                    description: testGoalDescription,
                }).then((goal) => {
                    const updatedGoalTitle = `${testGoalTitle}_new_title_3`;

                    cy.updateGoal(goal._shortId, { title: updatedGoalTitle });
                    cy.get(goalPageHeaderTitle.query).contains(updatedGoalTitle);
                    cy.deleteGoal(goal._shortId);
                });
            });

            it('can`t edit or delete other user`s goals', () => {
                cy.signInViaEmail();

                cy.createGoal(testProjectForGoals, {
                    title: testGoalTitle,
                    description: testGoalDescription,
                });

                cy.clearCookies();
                cy.visit(routes.signIn());

                cy.signInViaEmail({ email: testUser.email, password: testUser.password });

                cy.get<GoalCreateReturnType>('@createdGoal').then((goal) => {
                    cy.visit(routes.goal(goal._shortId));
                    cy.get(goalPageHeaderTitle.query).contains(goal.title);
                    cy.get(goalPageEditButton.query).should('not.exist');
                    cy.get(goalPageDeleteButton.query).should('not.exist');
                });
            });
        });
    });
});
