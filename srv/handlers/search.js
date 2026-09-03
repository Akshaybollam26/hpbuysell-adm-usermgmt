const { error } = require("@sap/cds");
const { SELECT } = require("@sap/cds/lib/ql/cds-ql");

module.exports = (srv) => {
    const {
        Users,
        PartnerAssignments,
        ProjectAssignments,
        ProjectUAMVH,
        CustomerVH,
        SupplierVH,
        UserGroups,
        GroupNameVH
    } = srv.entities;


    // srv.before("PATCH", PartnerAssignments.drafts, async (req) => {

    //     const { partnerId } = req.data;

    //     if (!partnerId) {
    //         return;
    //     }

    //     const draftRows = await SELECT.from(PartnerAssignments.drafts)
    //         .columns("ID", "partnerId");

    //     const duplicate = draftRows.find(r =>
    //         r.partnerId === partnerId &&
    //         r.ID !== req.data.ID
    //     );

    //     if (duplicate) {
    //         req.reject(400, "Partner ID is already selected.");
    //     }

    // });

    function extractEqValue(whereArr, fieldName) {
        if (!Array.isArray(whereArr)) return undefined;
 
        for (let i = 0; i < whereArr.length; i++) {
            if (
                whereArr[i]?.ref?.[0] === fieldName &&
                whereArr[i + 1] === '=' &&
                whereArr[i + 2]?.val !== undefined
            ) {
                return whereArr[i + 2].val;
            }
        }
 
        return undefined;
    }
 
    function stripCondition(whereArr, fieldName) {
        if (!Array.isArray(whereArr)) return;
 
        for (let i = 0; i < whereArr.length; i++) {
            if (
                whereArr[i]?.ref?.[0] === fieldName &&
                whereArr[i + 1] === '='
            ) {
                const clauseStart =
                    i > 0 &&
                        (whereArr[i - 1] === 'and' ||
                            whereArr[i - 1] === 'or')
                        ? i - 1
                        : i;
 
                const clauseEnd =
                    whereArr[i + 3] === 'and' ||
                        whereArr[i + 3] === 'or'
                        ? i + 3
                        : i + 2;
 
                whereArr.splice(
                    clauseStart,
                    clauseEnd - clauseStart + 1
                );
 
                return;
            }
        }
    }
    async function resolveOwnerEmail(rowID) {
        if (!rowID) return null;
 
        const [draftRow, activeRow] = await Promise.all([
            SELECT.one.from(PartnerAssignments.drafts).where({ ID: rowID }),
            SELECT.one.from(PartnerAssignments).where({ ID: rowID })
        ]);
 
        const ownerRow = draftRow || activeRow;
        return ownerRow?.user_email || null;
    }
    async function getAssignedPartnerIds(userEmail, partnerType) {
        if (!userEmail) return new Set();
 
        const draftAssignments = await SELECT.from(PartnerAssignments.drafts)
            .columns('partnerId')
            .where({ user_email: userEmail, partnerType });
 
        if (draftAssignments.length > 0) {
            return new Set(draftAssignments.map(r => r.partnerId).filter(Boolean));
        }
 
        const activeAssignments = await SELECT.from(PartnerAssignments)
            .columns('partnerId')
            .where({ user_email: userEmail, partnerType });
 
        return new Set(activeAssignments.map(r => r.partnerId).filter(Boolean));
    }
    srv.on('READ', CustomerVH, async (req) => {
        const whereArr = req.query.SELECT.where;
        const rowID = extractEqValue(whereArr, 'userEmail');
        if (rowID) stripCondition(whereArr, 'userEmail');

        const userEmail = await resolveOwnerEmail(rowID);

        const customers = await mdm.run(
            SELECT.from('Customer').columns('customerid', 'customername')
        );

        let candidateList = customers.map(c => ({
            customerid: c.customerid,
            customername: c.customername,
            userEmail: null
        }));

        if (!userEmail) return candidateList;

        const assignedIDs = await getAssignedPartnerIds(userEmail, 'C');
        return candidateList.filter(row => !assignedIDs.has(row.customerid));
    });
    srv.on('READ', SupplierVH, async (req) => {
        const mdm = await cds.connect.to('MdmCommonService');
        const whereArr = req.query.SELECT.where;
        const rowID = extractEqValue(whereArr, 'userEmail');
        if (rowID) stripCondition(whereArr, 'userEmail');

        const userEmail = await resolveOwnerEmail(rowID);

        const suppliers = await mdm.run(
            SELECT.from('Supplier').columns('supplierid', 'suppliername')
        );

        let candidateList = suppliers.map(s => ({
            supplierid: s.supplierid,
            suppliername: s.suppliername,
            userEmail: null
        }));

        if (!userEmail) return candidateList;

        const assignedIDs = await getAssignedPartnerIds(userEmail, 'S');
        return candidateList.filter(row => !assignedIDs.has(row.supplierid));
    });
    srv.on('READ', GroupNameVH, async () => {
        const rows = await SELECT
    .from(UserGroups)
    .columns('groupName')
    .where({ groupName: { '!=': null } });
    console.log([...new Map(rows.map(r => [r.groupName, r])).values()]);
return [...new Map(rows.map(r => [r.groupName, r])).values()];

    });

    /*
     * searchUsers function
     * Searches:
     * - email
     * - firstName
     * - lastName
     * - partnerId
     * - partnerName
     * - projectId
     * - projectName
     */
    srv.on("READ", "Users", async (req, next) => {
        const sSearch = req.query.SELECT.search;
        if (!sSearch) {
            return next();
        }
        const val = sSearch[0].val
        const like = `%${val}%`;
        /*
         * 1. Search direct user fields.
         */
        const directUsers = await SELECT
            .from(Users)
            .where`
                lower(email) like ${like}
                or lower(firstName) like ${like}
                or lower(lastName) like ${like}
            `;
        const resultEmails = new Set(
            directUsers.map(user => user.email)
        );
        /*
         * 2. Search partnerId and partnerName.
         */
        const matchingPartners = await SELECT
            .from(PartnerAssignments)
            .columns('user_email')
            .where`
                lower(partnerId) like ${like}
                or lower(partnerName) like ${like}
            `;
        for (const partner of matchingPartners) {
            if (partner.user_email) {
                resultEmails.add(partner.user_email);
            }
        }
        /*
         * 3. Search projectId and projectName.
         */
        const matchingProjects = await SELECT
            .from(ProjectAssignments)
            .columns('partner_ID')
            .where`
                lower(projectId) like ${like}
                or lower(projectName) like ${like}
            `;
        const partnerIDs = [
            ...new Set(
                matchingProjects
                    .map(project => project.partner_ID)
                    .filter(Boolean)
            )
        ];
        if (partnerIDs.length) {
            const projectPartners = await SELECT
                .from(PartnerAssignments)
                .columns('user_email')
                .where({
                    ID: {
                        in: partnerIDs
                    }
                });

            for (const partner of projectPartners) {
                if (partner.user_email) {
                    resultEmails.add(partner.user_email);
                }
            }
        }
        /*
         * Final user result.
         */
        const emails = [...resultEmails];
        if (!emails.length) {
            return [];
        }
        const result = SELECT
            .from(Users)
            .where({
                email: {
                    in: emails
                }
            });
        return result;
    });
    srv.on('findSelectedProjects', async (req) => {
        const { partnerID, isActiveEntity } = req.data;
        const isActive = isActiveEntity !== false;
        const mdmService = await cds.connect.to('MdmCommonService');
        const partnerTarget = isActive ? PartnerAssignments : PartnerAssignments.drafts;

        const oPartnerRecord = await SELECT.one.from(partnerTarget).where({ ID: partnerID })
        if (!partnerID) return [];
        var sTargetProfile = "";
        //try to select single from customer master for the given partner id - if yes it is customer, if not it is supplier
        const oCustomer = await mdmService.run(SELECT.one.from('CustomerVH').where({ customerid: oPartnerRecord.partnerId }));
        if (oCustomer)
            sTargetProfile = "customer";
        else {
            const oSupplier = await mdmService.run(SELECT.one.from('SupplierVH').where({ supplierid: oPartnerRecord.partnerId }));
            if (oSupplier)
                sTargetProfile = "suppliercode";
        }
        // const allRelevantProjects = await SELECT.from(ProjectUAMVH).where({ sTargetProfile: partnerID });
        let allRelevantProjects = [];
        if (sTargetProfile !== "") {
            if (sTargetProfile === "customer") allRelevantProjects = await mdmService.run(SELECT.from('ProjectUAMVH').where({ customer: oPartnerRecord.partnerId }));
            if (sTargetProfile === "suppliercode") allRelevantProjects = await mdmService.run(SELECT.from('ProjectUAMVH').where({ suppliercode: oPartnerRecord.partnerId }));
        }
        else {
            req.error(
                400,
                `Cannot manage projects - entered partner profile is not part of the master data`
            );
        }
        const ProjectTarget = isActive ? ProjectAssignments : ProjectAssignments.drafts;

        const assignedProjects = await SELECT
            .from(ProjectTarget)
            .columns('projectId')
            .where({ partner_ID: partnerID });
        const uniqueProjects = [
            ...new Map(
                allRelevantProjects.map(project => [
                    project.wbselement,
                    project
                ])
            ).values()
        ];
        // const allProjects = await SELECT.from(ProjectUAMVH).where({customer: partnerID });
        const assignedProjectIDs = assignedProjects.map(p => p.projectId);
        return uniqueProjects.map(project => ({
            ...project,
            selected: assignedProjectIDs.includes(project.wbselement)
        }));
    });
    srv.on('searchUsers', async (req) => {
        const searchTerm =
            req.data?.searchTerm ||
            req.params?.[0]?.searchTerm ||
            '';

        const normalizedSearch =
            String(searchTerm).trim().toLowerCase();

        if (!normalizedSearch) {
            return SELECT.from(Users);
        }

        const like = `%${normalizedSearch}%`;

        /*
         * 1. Search direct user fields.
         */
        const directUsers = await SELECT
            .from(Users)
            .where`
                lower(email) like ${like}
                or lower(firstName) like ${like}
                or lower(lastName) like ${like}
            `;

        const resultEmails = new Set(
            directUsers.map(user => user.email)
        );


        /*
         * 2. Search partnerId.
         */
        const matchingPartners = await SELECT
            .from(PartnerAssignments)
            .columns('user_email')
            .where`
                lower(partnerId) like ${like}
            `;

        for (const partner of matchingPartners) {
            if (partner.user_email) {
                resultEmails.add(partner.user_email);
            }
        }


        /*
         * 3. Search projectId.
         */
        const matchingProjects = await SELECT
            .from(ProjectAssignments)
            .columns('partner_ID')
            .where`
                lower(projectId) like ${like}
            `;

        const partnerIDs = [
            ...new Set(
                matchingProjects
                    .map(project => project.partner_ID)
                    .filter(Boolean)
            )
        ];

        if (partnerIDs.length) {
            const projectPartners = await SELECT
                .from(PartnerAssignments)
                .columns('user_email')
                .where({
                    ID: {
                        in: partnerIDs
                    }
                });

            for (const partner of projectPartners) {
                if (partner.user_email) {
                    resultEmails.add(partner.user_email);
                }
            }
        }


        /*
         * Final user result.
         */
        const emails = [...resultEmails];

        if (!emails.length) {
            return [];
        }

        return SELECT
            .from(Users)
            .where({
                email: {
                    in: emails
                }
            });
    });
};