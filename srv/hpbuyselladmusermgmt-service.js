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