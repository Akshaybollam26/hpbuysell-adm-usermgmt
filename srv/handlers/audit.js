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
    const { Users } = srv.entities;

    /*
     * Audit Fields on Create
     */

    srv.before('CREATE', Users, async (req) => {
        const now = new Date().toISOString();
        const userId = req.user?.id || 'anonymous';

        req.data.createdBy = userId;
        req.data.createdOn = now;
        req.data.changedBy = userId;
        req.data.changedOn = now;
    });


    /*
     * Audit Fields on Update
     */

    srv.before('UPDATE', Users, async (req) => {
        const now = new Date().toISOString();
        const userId = req.user?.id || 'anonymous';

        req.data.changedBy = userId;
        req.data.changedOn = now;
    });
};