module.exports = (srv) => {
    const { auth } = srv.entities;
    srv.on("READ", "auth", async (req) => {
        const isViewer = req.user.is("UsermgmtViewer");
        const isManage = req.user.is("UsermgmtManage");

        req.reply({
            ID: "AUTH",
            canCreate: isManage,
            canUpdate: isManage,
            canDelete: isManage
        });
    });
}   