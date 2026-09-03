const cds = require('@sap/cds');
const { executeHttpRequest } = require('@sap-cloud-sdk/http-client');
const { SELECT, UPDATE } = require('@sap/cds/lib/ql/cds-ql');

let mdm;
async function getMdm() {
    if (!mdm) {
        mdm = await cds.connect.to('MdmCommonService');
    }
    return mdm;
}

module.exports = async (srv) => {
    getMdm();
    const {
        PartnerAssignments,
        ProjectAssignments,
        ProjectMaster,
        Users,
        UserGroups
    } = srv.entities;
    srv.on('READ', 'CustomerVH', async req => {
        return mdm.run(req.query);
    });
    // srv.on('READ', 'CustomerVH', async (req) => {
    //     const whereArr = req.query.SELECT.where;

    //     function extractEqValue(fieldName) {
    //         if (!Array.isArray(whereArr)) return undefined;
    //         for (let i = 0; i < whereArr.length; i++) {
    //             if (whereArr[i]?.ref?.[0] === fieldName && whereArr[i + 1] === '=' && whereArr[i + 2]?.val !== undefined) {
    //                 return whereArr[i + 2].val;
    //             }
    //         }
    //         return undefined;
    //     }
    //     function stripCondition(fieldName) {
    //         if (!Array.isArray(whereArr)) return;
    //         for (let i = 0; i < whereArr.length; i++) {
    //             if (whereArr[i]?.ref?.[0] === fieldName && whereArr[i + 1] === '=') {
    //                 const clauseStart = i > 0 && (whereArr[i - 1] === 'and' || whereArr[i - 1] === 'or') ? i - 1 : i;
    //                 const clauseEnd = (whereArr[i + 3] === 'and' || whereArr[i + 3] === 'or') ? i + 3 : i + 2;
    //                 whereArr.splice(clauseStart, clauseEnd - clauseStart + 1);
    //                 return;
    //             }
    //         }
    //     }
    //     const rowID = extractEqValue('rowID');
    //     if (rowID) stripCondition('rowID');

    //     // existing behavior — proxy the (now-cleaned) query to MDM
    //     const results = await mdm.run(req.query);

    //     if (!rowID || !results?.length) return results;

    //     const [draftRow, activeRow] = await Promise.all([
    //         SELECT.one.from(PartnerAssignments.drafts).where({ ID: rowID }),
    //         SELECT.one.from(PartnerAssignments).where({ ID: rowID })
    //     ]);
    //     const ownerRow = draftRow || activeRow;
    //     if (!ownerRow?.user_email) return results;

    //     const userEmail = ownerRow.user_email;

    //     const [draftAssignments, activeAssignments] = await Promise.all([
    //         SELECT.from(PartnerAssignments.drafts).columns('partnerId').where({ user_email: userEmail, partnerType: 'C' }),
    //         SELECT.from(PartnerAssignments).columns('partnerId').where({ user_email: userEmail, partnerType: 'C' })
    //     ]);

    //     const assignedIDs = new Set([
    //         ...draftAssignments.map(r => r.partnerId).filter(Boolean),
    //         ...activeAssignments.map(r => r.partnerId).filter(Boolean)
    //     ]);
    //     assignedIDs.delete(ownerRow.partnerId);

    //     return results.filter(row => !assignedIDs.has(row.customerid));
    // });

    srv.on('READ', 'SupplierVH', async req => {
        return mdm.run(req.query);
    });
    // srv.on('READ', 'SupplierVH', async req => {
    //     const whereArr = req.query.SELECT.where;

    //     function extractEqValue(fieldName) {
    //         if (!Array.isArray(whereArr)) return undefined;
    //         for (let i = 0; i < whereArr.length; i++) {
    //             if (whereArr[i]?.ref?.[0] === fieldName && whereArr[i + 1] === '=' && whereArr[i + 2]?.val !== undefined) {
    //                 return whereArr[i + 2].val;
    //             }
    //         }
    //         return undefined;
    //     }

    //     function stripCondition(fieldName) {
    //         if (!Array.isArray(whereArr)) return;
    //         for (let i = 0; i < whereArr.length; i++) {
    //             if (whereArr[i]?.ref?.[0] === fieldName && whereArr[i + 1] === '=') {
    //                 const clauseStart = i > 0 && (whereArr[i - 1] === 'and' || whereArr[i - 1] === 'or') ? i - 1 : i;
    //                 const clauseEnd = (whereArr[i + 3] === 'and' || whereArr[i + 3] === 'or') ? i + 3 : i + 2;
    //                 whereArr.splice(clauseStart, clauseEnd - clauseStart + 1);
    //                 return;
    //             }
    //         }
    //     }

    //     const rowID = extractEqValue('rowID');
    //     if (rowID) stripCondition('rowID');

    //     // existing behavior — proxy the (now-cleaned) query to MDM
    //     const results = await mdm.run(req.query);

    //     if (!rowID || !results?.length) return results;

    //     const [draftRow, activeRow] = await Promise.all([
    //         SELECT.one.from(PartnerAssignments.drafts).where({ ID: rowID }),
    //         SELECT.one.from(PartnerAssignments).where({ ID: rowID })
    //     ]);
    //     const ownerRow = draftRow || activeRow;
    //     if (!ownerRow?.user_email) return results;

    //     const userEmail = ownerRow.user_email;

    //     const [draftAssignments, activeAssignments] = await Promise.all([
    //         SELECT.from(PartnerAssignments.drafts).columns('partnerId').where({ user_email: userEmail, partnerType: 'C' }),
    //         SELECT.from(PartnerAssignments).columns('partnerId').where({ user_email: userEmail, partnerType: 'C' })
    //     ]);

    //     const assignedIDs = new Set([
    //         ...draftAssignments.map(r => r.partnerId).filter(Boolean),
    //         ...activeAssignments.map(r => r.partnerId).filter(Boolean)
    //     ]);
    //     assignedIDs.delete(ownerRow.partnerId);

    //     return results.filter(row => !assignedIDs.has(row.supplierid));
    // });

    srv.on('READ', 'ProjectUAMVH', async req => {
        return mdm.run(req.query);
    });

    srv.on('syncusers', async (req) => {
        const headers = req.http?.req?.headers || {};
        try {
            // Use a managed CAP transaction for the database sync
            const tx = cds.tx(req);
            //1. fetch all users who belong to buysell group thru partial search
            //handle pagination
            const buysellcount = await executeHttpRequest(
                { destinationName: 'hpbuysell-ias-scim-dest' },
                {
                    method: 'GET',
                    url: `/scim/Users?filter=groups.display co "Buy Sell"&count=1`,

                    headers: {
                        Accept: 'application/scim+json'
                    }
                }
            );
            const grpcount = buysellcount.data.totalResults;
            const buysellgrps = await executeHttpRequest(
                { destinationName: 'hpbuysell-ias-scim-dest' },
                {
                    method: 'GET',
                    url: `/scim/Users?filter=groups.display co "Buy Sell"&count=${grpcount}`,
                    //url: `/scim/Users?count=250`,
                    headers: {
                        Accept: 'application/scim+json'
                    }
                }
            );

            //fetching buysell groups: 
            const groupsCountResponse = await executeHttpRequest(
                { destinationName: 'hpbuysell-ias-scim-dest' },
                {
                    method: 'GET',
                    url: `/scim/Groups?count=1`,
                    headers: {
                        Accept: 'application/scim+json'
                    }
                }
            );

            const groupCount = groupsCountResponse.data.totalResults;
            const groupsResponse = await executeHttpRequest(
                { destinationName: 'hpbuysell-ias-scim-dest' },
                {
                    method: 'GET',
                    url: `/scim/Groups?count=${groupCount}`,
                    headers: {
                        Accept: 'application/scim+json'
                    }
                }
            );

            //Create Group GUID -> Custom Group Name map
            const groupIdMap = new Map();

            for (const group of groupsResponse.data.Resources) {

                const customGroup =
                    group["urn:sap:cloud:scim:schemas:extension:custom:2.0:Group"];

                if (customGroup?.name) {

                    groupIdMap.set(
                        group.id,
                        customGroup.name
                    );
                }
            }
            // 2. construct a users payload for further operations

            const usersinfo = buysellgrps.data.Resources.map(user => {

                const groups = (user.groups || [])
                    .map(group => {
                        const groupId = groupIdMap.get(group.value);

                        if (!groupId) {
                            console.warn(
                                `No custom group name found for group GUID: ${group.value}`
                            );
                            return null;
                        }

                        return {
                            groupId: groupId,
                            groupName: group.display
                        };
                    })
                    .filter(Boolean);

                // const groups = (user.groups || []).map(group => ({
                //     groupId: group.$ref,
                //     groupName: group.display
                // }));

                const hasCustomer = groups.some(g =>
                    g.groupId?.toLowerCase().includes("customer")
                );

                const hasSupplier = groups.some(g =>
                    g.groupId?.toLowerCase().includes("supplier")
                );

                let partnerType = "HP";

                if (hasCustomer && hasSupplier) {
                    partnerType = "SC";
                } else if (hasCustomer) {
                    partnerType = "C";
                } else if (hasSupplier) {
                    partnerType = "S";
                }

                return {
                    email: user.emails?.find(e => e.primary)?.value
                        ?? user.emails?.[0]?.value,

                    firstName: user.name?.givenName,
                    lastName: user.name?.familyName,
                    active: user.active,
                    displayName: user.displayName,
                    userName: user.userName,
                    locale: user.locale,
                    preferredLanguage: user.preferredLanguage,
                    timeZone: user.timeZone,

                    userGroupIndicator: partnerType,

                    groups
                };
            });
            // 3. go by one by one user , 

            const existingUsers = await SELECT.from(Users); //fetching all users
            const existingUsersMap = new Map(
                existingUsers.map(user => [user.email, user])
            );
            const allGroups = await SELECT.from(UserGroups);
            const groupsByUser = new Map();

            for (const group of allGroups) {
                const email = group.user_email;

                if (!groupsByUser.has(email)) {
                    groupsByUser.set(email, []);
                }

                groupsByUser.get(email).push(group);
            }

            for (const user of usersinfo) {
                //1. if that user is not available in our DB , create a new user along with their usergroups
                const existingUser = existingUsersMap.get(user.email);

                if (!existingUser) {

                    await INSERT.into(Users).entries(user);
                    continue;
                }
                // 2. if that user is already there :
                //a. 1. check if the userinfo is updated or not , for users , only active status , first name , last name are modifiable. if no changes don't make update call to that particular user
                const userChanged =
                    existingUser.active !== user.active ||
                    existingUser.firstName !== user.firstName ||
                    existingUser.lastName !== user.lastName ||
                    existingUser.userGroupIndicator !== user.userGroupIndicator;

                if (userChanged) {
                    //update the users. 
                    await UPDATE(Users).set({
                        active: user.active,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        userGroupIndicator: user.userGroupIndicator
                    }).where({ email: user.email });

                }
                if (!user.active) {

                    await DELETE.from(UserGroups)
                        .where({
                            user_email: user.email
                        });
                    await DELETE.from(PartnerAssignments)
                        .where({ user_email: user.email });
                    continue;
                }
                //DB groups
                const existingGroups = groupsByUser.get(user.email) || [];
                const dbGroupMap = new Map(
                    existingGroups.map(g => [g.groupId, g.groupName])
                );
                const scimGroupMap = new Map(
                    (user.groups || []).map(g => [g.groupId, g.groupName])
                );

                for (const [groupId, scimGroup] of scimGroupMap) {

                    const dbGroup = dbGroupMap.get(groupId);

                    // New group
                    if (!dbGroup) {

                        await INSERT.into(UserGroups).entries({
                            user: {
                                email: user.email
                            },
                            groupId: groupId,
                            groupName: scimGroup
                        });

                        continue;
                    }

                    // Group name changed
                    if (dbGroup !== scimGroup) {

                        await UPDATE(UserGroups)
                            .set({
                                groupName: scimGroup
                            })
                            .where({
                                user_email: user.email,
                                groupId: groupId
                            });
                    }
                }
                for (const [groupId] of dbGroupMap) {

                    if (!scimGroupMap.has(groupId)) {

                        await DELETE.from(UserGroups)
                            .where({
                                user_email: user.email,
                                groupId: groupId
                            });
                    }
                }
            }

            const scimEmails = new Set(
                usersinfo.map(user => user.email)
            );

            for (const dbUser of existingUsers) {

                if (!scimEmails.has(dbUser.email) && dbUser.active) {
                    await UPDATE(Users).set({ active: false, userGroupIndicator: '' }).where({ email: dbUser.email });
                    await DELETE.from(UserGroups).where({ user_email: dbUser.email });
                    await DELETE.from(PartnerAssignments).where({ user_email: dbUser.email });
                }
            }
            return '${usersinfo.length} users loaded successfully';
        }
        catch (error) {
            console.error("Job Execution failed inside syncusers handler:", error);

            // Push the technical breakdown out directly into the Scheduler logs
            await doUpdateStatus(headers, false, { error: error.message }).catch(err => {
                console.error("Failed to push failure logs to Job S cheduler UI:", err);
            });

            // Terminate CAP route with structural error code status safely
            req.error({ code: ERROR_STATUS_CODE || 500, message: error.message });
        }
    });

    srv.on('deactivateUserMain', async (req) => {
        const useremail = req.params[0].email;
        const userData = await SELECT.one.from(Users).where({ email: useremail });
        if (!userData.active) {
            req.reject(404, `${useremail} has already been deactived.`);
        }
        await UPDATE(Users).set({ active: false, userGroupIndicator: '' }).where({ email: useremail });
        await DELETE.from(UserGroups).where({ user_email: useremail })
        await DELETE.from(PartnerAssignments)
            .where({ user_email: useremail });
        req.notify(`${useremail} have been deactivated.`);
    });
}