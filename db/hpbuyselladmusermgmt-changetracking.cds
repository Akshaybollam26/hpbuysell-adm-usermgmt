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
using {
    hpbuysell.adm.usermgmt.Users,
    hpbuysell.adm.usermgmt.UserGroups,
    hpbuysell.adm.usermgmt.PartnerAssignments,
    hpbuysell.adm.usermgmt.ProjectAssignments
} from './hpbuyselladmusermgmt-model';

/**
 * Users
 *
 * email is used as the human-readable object identifier.
 *
 * Only business fields are tracked.
 * managed fields createdAt, createdBy, modifiedAt and modifiedBy
 * are intentionally not annotated.
 */
annotate Users with {
    email              @changelog;
    firstName          @changelog;
    lastName           @changelog;
    displayName        @changelog;
    userName           @changelog;
    active             @changelog;
    userType           @changelog;
    locale             @changelog;
    preferredLanguage  @changelog;
    timeZone           @changelog;
    userGroupIndicator @changelog;
};

/**
 * IAS SCIM groups.
 *
 * groupName is the readable identifier shown in Change History.
 */
annotate UserGroups with {
    groupId   @changelog;
    groupName @changelog;
};

/**
 * Customer and supplier assignments.
 *
 * Both the type and ID identify the assignment.
 */
annotate PartnerAssignments with{
        partnerType @changelog;
        partnerId   @changelog;
        partnerName @changelog;
};

/**
 * Project assignments.
 *
 * projectId identifies the project assignment.
 */
annotate ProjectAssignments with {
    projectId   @changelog;
    projectName @changelog;
};