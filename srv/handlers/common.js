const mdm = await cds.connect.to('MdmCommonService');

module.exports = (srv) => {
    this.on('READ', 'CustomerVH', async req => {
        return mdm.run(req.query);
    });

    this.on('READ', 'SupplierVH', async req => {
        return mdm.run(req.query);
    });

    this.on('READ', 'ProjectUAMVH', async req => {
        return mdm.run(req.query);
    });
}