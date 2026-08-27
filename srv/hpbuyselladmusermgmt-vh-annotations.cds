using UserManagementService as service from './hpbuyselladmusermgmt-service';

annotate service.Users with {
    email     @(
        Common.ValueList               : {
            $Type                       : 'Common.ValueListType',
            CollectionPath              : 'Users',
            Parameters                  : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: email,
                ValueListProperty: 'email',
            }, ],
            Label                       : 'Email',
            // PresentationVariantQualifier: 'vh_EnterpriseSearch_companyCode',
        },
        Common.ValueListWithFixedValues: false,
    );
}
