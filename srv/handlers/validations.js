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

const { SELECT } = require("@sap/cds/lib/ql/cds-ql");

module.exports = (srv) => {
    const {
        Users,
        PartnerAssignments,
        ProjectAssignments,
        CustomerVH,
        SupplierVH,
        ProjectUAMVH,
        UserGroups
    } = srv.entities;

    /*
     * USER VALIDATIONS
     * No mandatory validations here.
     * firstName / lastName are handled by @mandatory.
     * email is key, so mandatory is handled by CDS/key behavior.
     */
    srv.before('CREATE', Users, async (req) => {
        const { email } = req.data;

        /*
         * Email regex validation only.
         * Do not write email mandatory validation here.
         */
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailRegex.test(email)) {
                return req.reject(400, 'Invalid email format');
            }
        }

        /*
         * Email uniqueness validation.
         * Email is key, but this gives controlled business error.
         */
        if (email) {
            const existingUser = await SELECT.one
                .from(Users)
                .where({ email });

            if (existingUser) {
                return req.reject(400, 'Duplicate email');
            }
        }
    });

    srv.before('UPDATE', Users, async (req) => {
        const email =
            req.data.email ||
            req.params?.[0]?.email;

        const existing = await SELECT.one
            .from(Users)
            .where({ email });

        if (!existing) {
            return req.reject(404, `User ${email} not found`);
        }

        // created fields must never be changed
        const nonEditableFields = [
            'createdBy',
            'createdOn'
        ];

        for (const field of nonEditableFields) {
            if (field in req.data) {
                return req.reject(
                    400,
                    `Field '${field}' cannot be modified`
                );
            }
        }
    });

    //validate that each partner profile have some project managed
    srv.before("SAVE", Users.drafts, async (req) => {
        const mdm = await cds.connect.to('MdmCommonService');
        const sUserEmail = req.data.email || req.params?.[0]?.email;
        if (!sUserEmail) return;
        
        // Get all partner assignments currently present in the User draft
        const userRecord = await SELECT.one.from(Users).where({ email: sUserEmail });
        //validate if editor is from finance group - Y? let them save without validation
        const userGroupRecords = await SELECT.from(UserGroups).where({ user_email: sUserEmail });
        for (const each of userGroupRecords) {
            if (each.groupId === "HP_BUYSELL_CUSTOMER_FINANCE_VIEWER_GRP") {
                return; // exits the entire handler
            }
        }
        const aPartners = await SELECT
            .from(PartnerAssignments.drafts)
            .columns("ID", "partnerId", "partnerType")
            .where({
                user_email: sUserEmail
            });
        //get projects of each partner - stop wherever validation fails(atleast one proj is mandatory before saving)
        for (const row of aPartners) {
            const aProjects = await SELECT
                .from(ProjectAssignments.drafts)
                .columns("ID")
                .where({
                    partner_ID: row.ID
                });
            if (aProjects.length === 0) {
                req.error(
                    400,
                    `Please assign at least one project to partner profile ${row.partnerId}.`
                );
            }
        }
    });

    /*
     * PARTNER ASSIGNMENT VALIDATIONS
     * No mandatory checks for partnerType / partnerId.
     * They are already handled by @mandatory in schema.
     */

    srv.before(['CREATE', 'UPDATE'], PartnerAssignments, async (req) => {
        const mdm = await cds.connect.to('MdmCommonService');
        const { partnerType, partnerId } = req.data;

        /*
         * partnerType business validation.
         * If your enum works in CDS, this is still safe backend protection.
         */
        if (
            partnerType &&
            !['C', 'S'].includes(partnerType)
        ) {
            return req.reject(
                400,
                'Partner Type must be C or S'
            );
        }

        /*
         * For UPDATE, load existing values if not provided in payload.
         */
        let existingAssignment = null;

        if (req.event === 'UPDATE') {
            existingAssignment = await SELECT.one
                .from(PartnerAssignments)
                .where({ ID });
            if (!existingAssignment) {
                return req.reject(
                    404,
                    'Partner assignment not found'
                );
            }
            /*
             * Once a Customer/Supplier assignment is created, its
             * identity fields must never change. Only the nested
             * projects (a separate entity, ProjectAssignments) may be
             * updated - that's handled entirely by the ProjectAssignments
             * validation below and is unaffected by this check.
             */
            if ('partnerType' in req.data && req.data.partnerType !== existingAssignment.partnerType) {
                return req.reject(400, 'Partner Type cannot be changed once created');
            }

            if ('partnerId' in req.data && req.data.partnerId && req.data.partnerId !== existingAssignment.partnerId) {
                await DELETE.from(ProjectTarget).where({ partner_ID: ID });
                return req.reject(400, 'Partner ID cannot be changed once created');
            }
        }
        const finalPartnerType = partnerType || existingAssignment?.partnerType;
        const finalPartnerId = partnerId || existingAssignment?.partnerId;
        /*
         * Validate Customer/Supplier against active master data.
         * Also auto-populate partnerName from master data.
         */
        if (finalPartnerType === 'C' && finalPartnerId) {
            const customer = await mdm.run(SELECT.one.from(Customer).where({ customerId: finalPartnerId }));
            if (!customer) {
                return req.reject(400, `Customer ID '${finalPartnerId}' does not exist in the master data or is inactive`);
            }
            req.data.partnerName = customer.customerName;
        }

        if (finalPartnerType === 'S' && finalPartnerId) {
            const supplier = await mdm.run(SELECT.one.from(Supplier).where({ supplierId: finalPartnerId }));
            if (!supplier) {
                return req.reject(400, `Supplier ID '${finalPartnerId}' does not exist in the master data or is inactive`);
            }
            req.data.partnerName = supplier.supplierName;
        }

        /*
         * Duplicate validation:
         * Same user cannot have same Customer/Supplier ID twice.
         */
        if (req.event === 'CREATE') {
            const userEmail = req.data.user_email || req.data.user?.email;
            if (userEmail && finalPartnerType && finalPartnerId) {
                const duplicate = await SELECT.one.from(PartnerAssignments).where({ user_email: userEmail, partnerType: finalPartnerType, partnerId: finalPartnerId });
                if (duplicate) { return req.reject(400, 'Duplicate Customer/Supplier ID for user') }
            }
        }
    });
    // srv.on('CREATE', PartnerAssignments.drafts, async (req) => {
    //     console.log("came here in PA draft handler");
    //     const mdm = await cds.connect.to('MdmCommonService');
    //     const { partnerType, partnerId } = req.data;

    //     if (!partnerType || !partnerId) return;

    //     if (partnerType === 'C') {
    //         const customer = await mdm.run(
    //             SELECT.one.from('Customer')
    //                 .columns('customername')
    //                 .where({ customerid: partnerId })
    //         );

    //         if (!customer) {
    //             return req.reject(400, `Customer ID '${partnerId}' does not exist in the master data or is inactive`);
    //         }

    //         req.data.partnerName = customer.customername;
    //     }

    //     else if (partnerType === 'S') {
    //         const supplier = await mdm.run(
    //             SELECT.one.from('Supplier')
    //                 .columns('suppliername')
    //                 .where({ supplierid: partnerId })
    //         );

    //         if (!supplier) {
    //             return req.reject(400, `Supplier ID '${partnerId}' does not exist in the master data or is inactive`);
    //         }

    //         req.data.partnerName = supplier.suppliername;
    //     }
    // });
    srv.before('UPDATE', PartnerAssignments.drafts, async (req) => {
        const mdm = await cds.connect.to('MdmCommonService');
        const ID = req.data.ID || req.params?.[0]?.ID;
        console.log("came here")
        if (!ID) return req.reject(400, 'Partner assignment ID is missing');

        const existingAssignment = await SELECT.one.from(PartnerAssignments.drafts).where({ ID });
        if (!existingAssignment) return req.reject(404, 'Partner assignment not found');

        const partnerIdChanged = 'partnerId' in req.data && req.data.partnerId && req.data.partnerId !== existingAssignment.partnerId;
        const partnerTypeChanged = 'partnerType' in req.data && req.data.partnerType && req.data.partnerType !== existingAssignment.partnerType;

        if (partnerIdChanged || partnerTypeChanged) {
            await DELETE.from(ProjectAssignments.drafts).where({ partner_ID: ID });
        }

        //1 sep 2026 - 
        const finalPartnerId = req.data.partnerId;
        const finalPartnerType = req.data.partnerType;
        if (finalPartnerType === 'C') {
            const customer = await mdm.run(
                SELECT.one.from('Customer').columns('customername').where({ customerid: finalPartnerId })
            );
            // if (!customer) return req.reject(400, `Customer ID '${finalPartnerId}' does not exist in the master data or is inactive`);
            if(customer) req.data.partnerName = customer.customername;
        }

        if (finalPartnerType === 'S') {
            const supplier = await mdm.run(
                SELECT.one.from('Supplier').columns('suppliername').where({ supplierid: finalPartnerId })
            );
            // if (!supplier) return req.reject(400, `Supplier ID '${finalPartnerId}' does not exist in the master data or is inactive`);
            if(supplier) req.data.partnerName = supplier.suppliername;
        }
    });

    /*
     * PROJECT ASSIGNMENT VALIDATIONS
     * No mandatory check for projectId.
     * It is already handled by @mandatory in schema.
     */

    srv.before(['CREATE', 'UPDATE'], ProjectAssignments, async (req) => {
        const mdmService = await cds.connect.to('MdmCommonService');
        const { projectId } = req.data;

        let existingAssignment = null;

        if (req.event === 'UPDATE') {
            const ID =
                req.data.ID ||
                req.params?.[0]?.ID;

            existingAssignment = await SELECT.one
                .from(ProjectAssignments)
                .where({ ID });

            if (!existingAssignment) {
                return req.reject(
                    404,
                    'Project assignment not found'
                );
            }
        }

        const finalProjectId =
            projectId ||
            existingAssignment?.projectId;

        /*
         * Validate project exists and is active.
         * Auto-populate projectName from ProjectUAMVH.
         */
        if (finalProjectId) {
            const project = await mdmService.run(SELECT.one
                .from(ProjectUAMVH)
                .where({
                    wbselement: finalProjectId
                }));

            if (!project) {
                return req.reject(
                    400,
                    `Project ID '${finalProjectId}' does not exist or is inactive`
                );
            }

            req.data.projectName = project.projectName;
        }

        /*
         * Duplicate validation:
         * Same project cannot be assigned twice under same partner assignment.
         */
        if (req.event === 'CREATE') {
            const partnerID =
                req.data.partner_ID ||
                req.data.partner?.ID;

            if (
                partnerID &&
                finalProjectId
            ) {
                const duplicate = await SELECT.one
                    .from(ProjectAssignments)
                    .where({
                        partner_ID: partnerID,
                        projectId: finalProjectId
                    });

                if (duplicate) {
                    return req.reject(
                        400,
                        'Duplicate project for this Customer/Supplier assignment'
                    );
                }
            }
        }

        if (req.event === 'UPDATE') {
            const ID =
                req.data.ID ||
                req.params?.[0]?.ID;

            const partnerID =
                req.data.partner_ID ||
                existingAssignment?.partner_ID;

            if (
                partnerID &&
                finalProjectId
            ) {
                const duplicate = await SELECT.one
                    .from(ProjectAssignments)
                    .where({
                        partner_ID: partnerID,
                        projectId: finalProjectId
                    });

                if (
                    duplicate &&
                    duplicate.ID !== ID
                ) {
                    return req.reject(
                        400,
                        'Duplicate project for this Customer/Supplier assignment'
                    );
                }
            }
        }
    });
};