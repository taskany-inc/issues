import { configureDomObjects } from 'dom-objects';

const DO = configureDomObjects({ attributeName: 'cy' });

export const header = DO('header');
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
