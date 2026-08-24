const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {
    require('./handlers/validations')(this);
    require('./handlers/audit')(this);
    require('./handlers/projectActions')(this);
    require('./handlers/search')(this);
    require('./handlers/auth')(this);
    require('./handlers/export')(this);
    require('./handlers/common')(this);
});