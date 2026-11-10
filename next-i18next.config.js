const path = require('path');

module.exports = {
  i18n: {
    locales: ['en', 'fr', 'de'],
    defaultLocale: 'en',
  },
  localePath: path.resolve('./public/locales'),
  interpolation: {
    escapeValue: false,
  },
};
