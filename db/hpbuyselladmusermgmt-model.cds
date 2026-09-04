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

namespace hpbuysell.adm.usermgmt;

using {
    cuid,
    managed
} from '@sap/cds/common';

/**
 * Primary entity: application Users
 * Email is the business key. Only firstName/lastName may
 * be changed once a record has been created.
 */


aspect FlexFields {
    FlexField1 : String(255);
    FlexField2 : String(255);
    FlexField3 : String(255);
    FlexField4 : String(255);
    FlexField5 : String(255);
}

entity Users : managed, FlexFields {

    key email              : String(241)
        @title: '{i18n>Email}';

        firstName          : String(100)
        @Core.Immutable
        @title: '{i18n>FirstName}'
        @mandatory;

        lastName           : String(100)
        @Core.Immutable
        @title: '{i18n>LastName}'
        @mandatory;
        displayName        : String(100);
        userName           : String(100);
        active             : Boolean default true
        @Core.Immutable;

        userType           : String(50);
        locale             : String(20);
        preferredLanguage  : String(20);
        timeZone           : String(100);
        // userGroupIndicator : String(2);
        userGroupIndicator : String(50) enum {
            Customer = 'C';
            Supplier = 'S';
            Customer_Supplier = 'SC';
            Others = 'HP'
        };
        customers          : Composition of many PartnerAssignments
                                 on  customers.user        = $self
                                 and customers.partnerType = 'C';

        suppliers          : Composition of many PartnerAssignments
                                 on  suppliers.user        = $self
                                 and suppliers.partnerType = 'S';

        groups             : Composition of many UserGroups
                                 on groups.user = $self;
}


entity PartnerAssignments : cuid, FlexFields {

    user        : Association to Users;

    @title: '{i18n>PartnerType}'
    @mandatory
    partnerType : String(1) enum {
        Customer = 'C';
        Supplier = 'S';
    };

    partnerId   : String(20)
    @title              : '{i18n>PartnerId}'
    @mandatory
    @cds.odata.valuelist
    @Common.FieldControl: {$edmJson: {$If: [
        {$Path: 'HasActiveEntity'},
        {$EnumMember: 'com.sap.vocabularies.Common.v1.FieldControlType/ReadOnly'},
        {$EnumMember: 'com.sap.vocabularies.Common.v1.FieldControlType/Optional'}
    ]}};

    partnerName : String(100)
    @title              : '{i18n>PartnerName}'
    @Common.FieldControl: #ReadOnly
    // @Core.Computed: false
    @Common.FieldControl: {$edmJson: {$If: [
        {$Path: 'HasActiveEntity'},
        {$EnumMember: 'com.sap.vocabularies.Common.v1.FieldControlType/ReadOnly'},
        {$EnumMember: 'com.sap.vocabularies.Common.v1.FieldControlType/Optional'}
    ]}};

    projects    : Composition of many ProjectAssignments
                      on projects.partner = $self;
}


entity ProjectAssignments : cuid, FlexFields {

    partner     : Association to PartnerAssignments;

    projectId   : String(20)
    @title: '{i18n>ProjectId}'
    @mandatory;

    projectName : String(100)
    @title: '{i18n>ProjectName}';
}


entity UserGroups : managed, FlexFields {

    key user      : Association to Users;

    key groupId   : String;

        groupName : String(255);
}
