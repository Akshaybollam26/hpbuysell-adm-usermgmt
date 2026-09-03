using UserManagementService as service from './hpbuyselladmusermgmt-service';


annotate service.Users with {
    email     @(
        Common.ValueList               : {
            $Type         : 'Common.ValueListType',
            CollectionPath: 'Users',
            Parameters    : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: email,
                ValueListProperty: 'email',
            }, ],
            Label         : 'Email',
        // PresentationVariantQualifier: 'vh_EnterpriseSearch_companyCode',
        },
        Common.ValueListWithFixedValues: false,
    );
    firstName @(
        Common.ValueList               : {
            $Type         : 'Common.ValueListType',
            CollectionPath: 'Users',
            Parameters    : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: firstName,
                ValueListProperty: 'firstName',
            }, ],
            Label         : 'First Name',
        // PresentationVariantQualifier: 'vh_EnterpriseSearch_companyCode',
        },
        Common.ValueListWithFixedValues: false,
    );
    lastName  @(
        Common.ValueList               : {
            $Type         : 'Common.ValueListType',
            CollectionPath: 'Users',
            Parameters    : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: lastName,
                ValueListProperty: 'lastName',
            }, ],
            Label         : 'Last Name',
        // PresentationVariantQualifier: 'vh_EnterpriseSearch_companyCode',
        },
        Common.ValueListWithFixedValues: false,
    );
}

annotate service.SupplierVH with {
    supplierid   @title: 'Supplier ID';
    suppliername @title: 'Supplier Name';
};
annotate service.CustomerVH with {
    customerid   @title: 'Customer ID';
    customername @title: 'Customer Name';
};

annotate service.PartnerAssignments with {
    partnerId @(
        Common.ValueListRelevantQualifiers: {$edmJson: {$If: [
            {$Eq: [
                {$Path: 'partnerType'},
                'S'
            ]},
            ['Supplier'],
            ['Customer']
        ]}},
        Common.ValueList #Supplier        : {
            CollectionPath: 'SupplierVH',
            Parameters    : [
                {
                    $Type            : 'Common.ValueListParameterInOut',
                    LocalDataProperty: partnerId,
                    ValueListProperty: 'supplierid',
                },
                {
                    $Type            : 'Common.ValueListParameterOut',
                    LocalDataProperty: partnerName,
                    ValueListProperty: 'suppliername',
                },
                // { 
                //     $Type: 'Common.ValueListParameterIn',
                //     LocalDataProperty: ID, 
                //     ValueListProperty: 'rowID' 
                // }
            ]
        },
        Common.ValueList #Customer        : {
            CollectionPath: 'CustomerVH',
            Parameters    : [
                {
                    $Type            : 'Common.ValueListParameterInOut',
                    LocalDataProperty: partnerId,
                    ValueListProperty: 'customerid',
                },
                {
                    $Type            : 'Common.ValueListParameterOut',
                    LocalDataProperty: partnerName,
                    ValueListProperty: 'customername',
                },
                // { 
                //     $Type: 'Common.ValueListParameterIn',
                //     LocalDataProperty: ID, 
                //     ValueListProperty: 'rowID' 
                // }
            ]
        },
        Common.ValueListForValidation: true,
    )
};

annotate service.UserGroups with {
    groupName @(
        Common.ValueList               : {
            $Type         : 'Common.ValueListType',
            CollectionPath: 'GroupNameVH',
            Parameters    : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: groupName,
                ValueListProperty: 'groupName',
            }, ],
            Label         : 'Group Name',
        // PresentationVariantQualifier: 'vh_EnterpriseSearch_companyCode',
        },
        Common.ValueListWithFixedValues: false,
    );
}
