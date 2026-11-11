const path = require('path');

// The site's languages are the skill tree's (packages/core/src/locales/locales.json).
const languages = require('./packages/core/src/locales/locales.json');

module.exports = {
  i18n: {
    locales: languages.map((language) => language.code),
    defaultLocale: 'en',
  },
  localePath: path.resolve('./public/locales'),
  interpolation: {
    escapeValue: false,
  },
};
