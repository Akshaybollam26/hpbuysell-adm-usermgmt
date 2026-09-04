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
using {hpbuysell.adm.usermgmt as db} from '../db/hpbuyselladmusermgmt-model';
using {sap.changelog as cl} from '@cap-js/change-tracking';
using {
    mdm_common_metadata.Customer as MdmCustomerVH,
    mdm_common_metadata.Supplier as MdmSupplierVH,
    mdm_common_metadata.ProjectUAMVH as MdmProjectUAMVH
} from './external/mdm-common-metadata';

@changelog.Ui.ChangeHistoryView 
service UserManagementService 
@(path: '/user-management')
{
    @odata.singleton  @cds.persistence.skip
    entity auth {

        key ID        : String;
            canCreate : Boolean;
            canUpdate : Boolean;
            canDelete : Boolean;
    }

    @restrict: [
        {
            grant: 'READ',
            to   : [
                'UsermgmtViewer',
                'UsermgmtManage'
            ]
        },
        {
            grant: [
                'CREATE',
                'UPDATE',
                'EXECUTE',
                'deactivateUserMain'
            ],
            to   : 'UsermgmtManage'
        }
 
    ]
    @odata.draft.enabled
    @(Capabilities: {
        InsertRestrictions: {Insertable: false},
        DeleteRestrictions: {Deletable: false},
        UpdateRestrictions: {Updatable: true}
    })
    entity Users              as projection on db.Users
    actions {
        @(
            cds.odata.bindingparameter.name: '_it',
            Common.SideEffects: {
                TargetProperties: [
                    '_it/active',
                    '_it/userGroupIndicator'
                ]
            }
        )
        action deactivateUserMain();
    };

    @Common.SideEffects #PartnerChange: {
        SourceProperties: [
            partnerId,
            partnerType
        ],
        TargetEntities: [
            projects
        ]
    }
    entity PartnerAssignments as projection on db.PartnerAssignments{
    *,
    virtual userEmail : String(241)
};
 
    entity ProjectAssignments as projection on db.ProjectAssignments;

    @readonly
    entity CustomerVH as projection on MdmCustomerVH{
        *,
        cast(null as String(241)) as userEmail
    };

    @readonly
    entity SupplierVH as projection on MdmSupplierVH{
        *,
        cast(null as String(241)) as userEmail
    };

    @readonly
    entity ProjectUAMVH as projection on MdmProjectUAMVH;
 
    @readonly
    @restrict: [{ grant: 'READ', to: ['UsermgmtViewer', 'UsermgmtManage'] }]
    entity ChangeView as projection on cl.ChangeView;

    entity UserGroups as projection on db.UserGroups;

    @readonly
    @cds.persistence.skip
    entity GroupNameVH {
        key groupName : String(255);
    }

    function searchUsers(searchTerm: String)                                                       returns array of Users;
    function findSelectedProjects(partnerID: UUID, isActiveEntity: Boolean)                        returns array of ProjectUAMVH;
    action   exportUsers(emails: array of String)                                                  returns {
        fileName : String;
        base64   : LargeString;
    };
    action   addProjects(partnerID: UUID, isActiveEntity: Boolean, projectIds: array of String)    returns array of ProjectAssignments;
    action   removeProjects(partnerID: UUID, isActiveEntity: Boolean, projectIds: array of String) returns Boolean;
    @(requires: ['JOBSCHEDULER', 'UsermgmtManage'])
    action syncusers() returns String;
    
}
