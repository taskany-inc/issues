import { configureDomObjects } from 'dom-objects';

const DO = configureDomObjects({ attributeName: 'cy' });

export const header = DO('header');
export const headerMenu = header.add('menu');
export const headerMenuGoals = headerMenu.add('goals');
export const headerMenuProjects = headerMenu.add('projects');
export const headerMenuExplore = headerMenu.add('explore');
export const createFastButton = header.add('createFastButton');
export const createSelectButton = header.add('createSelectButton');
export const createProjectItem = header.add('createProjectItem');
export const createGoalItem = header.add('createGoalItem');

export const projectCreateForm = DO('projectCreateForm');
export const projectTitleInput = projectCreateForm.add('titleInput');
export const projectDescriptionInput = projectCreateForm.add('descriptionInput');
export const projectCancelButton = projectCreateForm.add('cancelButton');
export const projectSubmitButton = projectCreateForm.add('submitButton');
export const projectKeyPredictor = projectCreateForm.add('keyPredictor');
export const projectKeyPredictorInput = projectCreateForm.add('keyPredictorInput');
export const projectKeyPredictorHint = projectCreateForm.add('keyPredictorHint');
export const projectKeyPredictorError = projectCreateForm.add('keyPredictorError');

export const pageHeader = DO('pageHeader');
export const pageTitle = pageHeader.add('title');
export const pageDescription = pageHeader.add('description');
export const pageBreadcrumbs = pageHeader.add('breadcrumbs');
export const pageTabs = pageHeader.add('tabs');
export const pageActiveTabItem = pageTabs.add('activeTabItem');

export const projectListItem = DO('projectListItem');
export const projectListItemTitle = projectListItem.add('title');
export const projectGoalList = projectListItem.add('goals');
export const projectGoalListItem = projectListItem.add('goalItem');

export const createGoalInlineControl = DO('createGoalInlineControl');

export const goalCreateForm = DO('goalCreateForm');
export const goalProjectSelectControl = goalCreateForm.add('project');
