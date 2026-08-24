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
// @(require: 'authenticated-user')
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
        InsertRestrictions: {Insertable: true},
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

    entity PartnerAssignments as projection on db.PartnerAssignments;
 
    entity ProjectAssignments as projection on db.ProjectAssignments;

    @readonly
    entity CustomerVH as projection on MdmCustomerVH;

    @readonly
    entity SupplierVH as projection on MdmSupplierVH;

    @readonly
    entity ProjectUAMVH as projection on MdmProjectUAMVH;
 
    @readonly
    @restrict: [{ grant: 'READ', to: ['UsermgmtViewer', 'UsermgmtManage'] }]
    entity ChangeView as projection on cl.ChangeView;

 
    entity BusinessPartnerVH  as
            select from CustomerVH {
                key customerid   as partnerId,
                    customerid   as customerId,
                    cast(
                        null as String(10)
                    )            as supplierId,
                    customername as partnerName,
                    cast(
                        'C' as String(1)
                    )            as partnerType,
                    cast(
                        null as String(241)
                    )            as userEmail
            }
            union all
            select from SupplierVH {
                key supplierid   as partnerId,
                    cast(
                        null as String(10)
                    )            as customerId,
                    supplierid   as supplierId,
                    suppliername as partnerName,
                    cast(
                        'S' as String(1)
                    )            as partnerType,
                    cast(
                        null as String(241)
                    )            as userEmail
            };

    entity UserGroups as projection on db.UserGroups;
    function searchUsers(searchTerm: String)                                                       returns array of Users;
    function getUnassignedCustomers(userEmail: String, isActiveEntity: Boolean)                    returns array of CustomerVH;
    function getUnassignedSuppliers(userEmail: String, isActiveEntity: Boolean)                    returns array of SupplierVH;
    function findSelectedProjects(partnerID: UUID, isActiveEntity: Boolean)                        returns array of ProjectUAMVH;
        
    action   exportUsers(emails: array of String)                                                  returns {
        fileName : String;
        base64   : LargeString;
    };
    action   addProjects(partnerID: UUID, isActiveEntity: Boolean, projectIds: array of String)    returns array of ProjectAssignments;
    action   removeProjects(partnerID: UUID, isActiveEntity: Boolean, projectIds: array of String) returns Boolean;
    @(requires: 'JOBSCHEDULER')
    action syncusers() returns String;
    
}
