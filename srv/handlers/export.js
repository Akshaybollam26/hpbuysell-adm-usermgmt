const cds = require('@sap/cds');
const ExcelJS = require('exceljs');
module.exports = (srv) => {
    const { Users } = srv.entities;
    function fmtDate(d) {
        return d ? new Date(d) : null;
    }

    srv.on('exportUsers', async (req) => {
        const { emails } = req.data;
        const hasSelection = Array.isArray(emails) && emails.length > 0;

        const users = await SELECT.from(Users)
            .columns(u => {
                u.email, u.firstName, u.lastName, u.active, u.createdAt, u.modifiedAt,
                u.customers(c => {
                    c.partnerType, c.partnerId, c.partnerName,
                    c.projects(p => { p.projectId, p.projectName });
                }),
                u.suppliers(s => {
                    s.partnerType, s.partnerId, s.partnerName,
                    s.projects(p => { p.projectId, p.projectName });
                }),
                u.groups(g => { g.groupId, g.groupName });
            })
            .where(hasSelection ? { email: { in: emails } } : {});

        if (!users.length) {
            return req.reject(404, hasSelection ? 'No matching users found' : 'No users to export');
        }

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Sheet1');

        sheet.columns = [
            { header: 'User Acount ID', key: 'userAccountId', width: 24 },
            { header: 'First Name', key: 'firstName', width: 16 },
            { header: 'Last Name', key: 'lastName', width: 16 },
            { header: 'Email Address', key: 'emailAddress', width: 24 },
            { header: 'User Acount Created Date', key: 'createdDate', width: 20 },
            { header: 'Role Name', key: 'roleName', width: 40 },
            { header: 'Company Code', key: 'companyCode', width: 14 },
            { header: 'Partner Code', key: 'partnerCode', width: 14 },
            { header: 'Partner Code Name', key: 'partnerCodeName', width: 28 },
            { header: 'WBS-Project Code', key: 'wbsProjectCode', width: 16 },
            { header: 'User Account Status', key: 'accountStatus', width: 16 },
            { header: 'Last Modified Date (per User account, Application, role and WBS if applicable)', key: 'modifiedDate', width: 24 },
            { header: 'Last Login Date Per User Account', key: 'lastLoginDate', width: 20 },
            { header: 'Buyer Code', key: 'buyerCode', width: 14 },
            { header: 'Buyer Email', key: 'buyerEmail', width: 24 },
            { header: 'Buyer Employee ID', key: 'buyerEmployeeId', width: 16 },
            { header: 'Reporting source', key: 'reportingSource', width: 18 }
        ];


        sheet.getRow(1).font = { bold: true };


        for (const user of users) {
            const partners = [
                ...(user.customers || []),
                ...(user.suppliers || [])
            ];


            const groups = user.groups || [];


            const accountStatus =
                user.active === false ? 'INACTIVE' : 'ACTIVE';


            function addRow(partner, project, group) {
                sheet.addRow({
                    userAccountId: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    emailAddress: user.email,
                    createdDate: fmtDate(user.createdAt),


                    // Role Name is now the individual group name
                    roleName: group ? group.groupName : '',


                    companyCode: '',
                    partnerCode: partner ? partner.partnerId : '',
                    partnerCodeName: partner ? partner.partnerName : '',
                    wbsProjectCode: project ? project.projectId : '',
                    accountStatus,
                    modifiedDate: fmtDate(user.modifiedAt),
                    lastLoginDate: '',
                    buyerCode: '',
                    buyerEmail: '',
                    buyerEmployeeId: '',
                    reportingSource: ''
                });
            }


            if (!partners.length) {
                // No partner, but still create rows for each group
                if (groups.length) {
                    for (const group of groups) {
                        addRow(null, null, group);
                    }
                } else {
                    addRow(null, null, null);
                }
            } else {
                for (const partner of partners) {
                    const projects =
                        partner.projects && partner.projects.length
                            ? partner.projects
                            : [null];


                    for (const project of projects) {
                        // Create one row for every group
                        if (groups.length) {
                            for (const group of groups) {
                                addRow(partner, project, group);
                            }
                        } else {
                            addRow(partner, project, null);
                        }
                    }
                }
            }
        }


        // Date columns formatted as dates
        ['createdDate', 'modifiedDate'].forEach((key) => {
            const col = sheet.getColumn(key);
            col.numFmt = 'yyyy-mm-dd hh:mm:ss';
        });


        const buffer = await workbook.xlsx.writeBuffer();


        return {
            fileName: 'UserExport.xlsx',
            base64: buffer.toString('base64')
        };
    });
};