//-----------------------------------------------------------------------------------*
// Confidential and Proprietary
// Copyright 2026, HP
// All Rights Reserved
//-----------------------------------------------------------------------------------*
// Application Name :    User Managment Application
// WRICEF No        :
// Release          :
// Author           :    Meer Arfat Ali/Akshay Bollam
// Date             :    02.09.2026
// Description      :    User Managment Application
//-----------------------------------------------------------------------------------*
//Change Log:
//    Date      |   Author      |   Defect/Incident     |   Change Description
//-----------------------------------------------------------------------------------*/
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