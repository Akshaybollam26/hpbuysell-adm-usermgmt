const cds = require('@sap/cds');
const { SELECT, UPDATE } = require('@sap/cds/lib/ql/cds-ql');
module.exports = (srv) => {
    const {
        PartnerAssignments,
        ProjectAssignments,
        ProjectUAMVH,
        Users,
        UserGroups
    } = srv.entities;

    srv.on('addProjects', async (req) => {
        const mdmService = await cds.connect.to('MdmCommonService');
        const { partnerID, isActiveEntity, projectIds } = req.data;
        const isActive = isActiveEntity !== false;

        if (!Array.isArray(projectIds) || projectIds.length === 0) {
            return [];
        }

        const PartnerTarget = isActive ? PartnerAssignments : PartnerAssignments.drafts;
        const ProjectTarget = isActive ? ProjectAssignments : ProjectAssignments.drafts;

        const partner = await SELECT.one
            .from(PartnerTarget)
            .where({ ID: partnerID });

        if (!partner) {
            return req.reject(404, 'Partner assignment not found');
        }

        const uniqueProjectIds = [...new Set(projectIds)];

        const activeProjects = await mdmService.run(SELECT.from(ProjectUAMVH).where({ wbselement: { in: uniqueProjectIds } }));
        const uniqueProjects = [
            ...new Map(
                activeProjects.map(project => [
                    project.wbselement,
                    project
                ])
            ).values()
        ];

        // if (activeProjects.length !== uniqueProjectIds.length) {
        //     return req.reject(400, 'One or more selected projects do not exist or are inactive');
        // }

        const existingAssignments = await SELECT
            .from(ProjectTarget)
            .where({ partner_ID: partnerID });

        const existingProjectIds = new Set(existingAssignments.map(row => row.projectId));

        const projectsToInsert = uniqueProjects
            .filter(project => !existingProjectIds.has(project.wbselement))
            .map(project => ({
                ID: cds.utils.uuid(),
                partner_ID: partnerID,
                projectId: project.wbselement,
                projectName: project.wbsdescription,
                ...(isActive ? {} : {
                    IsActiveEntity: false,
                    DraftAdministrativeData_DraftUUID: partner.DraftAdministrativeData_DraftUUID
                })
            }));

        if (!projectsToInsert.length) {
            return [];
        }

        await srv.run(INSERT.into(ProjectTarget).entries(projectsToInsert));

        return projectsToInsert;
    });

    srv.on('removeProjects', async (req) => {
        const { partnerID, isActiveEntity, projectIds } = req.data;
        const isActive = isActiveEntity !== false;

        if (!Array.isArray(projectIds) || projectIds.length === 0) {
            return true;
        }

        const PartnerTarget = isActive ? PartnerAssignments : PartnerAssignments.drafts;
        const ProjectTarget = isActive ? ProjectAssignments : ProjectAssignments.drafts;

        const partner = await SELECT.one
            .from(PartnerTarget)
            .where({ ID: partnerID });

        if (!partner) {
            return req.reject(404, 'Partner assignment not found');
        }

        const uniqueProjectIds = [...new Set(projectIds)];

        const assignmentsToDelete = await SELECT.from(ProjectTarget).where({ partner_ID: partnerID, projectId: { in: uniqueProjectIds } });

        if (!assignmentsToDelete.length) {
            return true;
        }

        await DELETE.from(ProjectTarget).where({ ID: { in: assignmentsToDelete.map(row => row.ID) } });

        return true;
    });
};