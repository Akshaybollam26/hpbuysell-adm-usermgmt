const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {
    require('./handlers/validations')(this);
    require('./handlers/audit')(this);
    // require('./handlers/changelog')(this);
    require('./handlers/projectActions')(this);
    require('./handlers/search')(this);
    require('./handlers/auth')(this);
    require('./handlers/export')(this);
    const mdm = await cds.connect.to('MdmCommonService');

    this.on('READ', 'CustomerVH', async req => {
        console.log('READ CustomerVH');
        console.log(req.query);
        return mdm.run(req.query);
    });

    this.on('READ', 'SupplierVH', async req => {
        console.log('READ SupplierVH');
        console.log(req.query);
        return mdm.run(req.query);
    });

    this.on('READ', 'ProjectUAMVH', async req => {
        console.log('READ ProjectUAMVH');
        console.log(req.query);
        return mdm.run(req.query);
    });
});