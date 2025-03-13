import { tr } from './utils.i18n';

export const AllTips = [
    tr('Your smile is my favorite kind of sunlight. Have a nice day!'),
    tr('Good day!'),
    tr('Hurray! Something interesting awaits you today!'),
    tr('Life is wonderful!'),
    tr("Don't worry, be happy"),
];

export const getRandomIndex = () => Math.floor(Math.random() * AllTips.length);
