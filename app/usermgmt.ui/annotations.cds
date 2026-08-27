using UserManagementService as service from '../../srv/hpbuyselladmusermgmt-service';

annotate service.Users with @(
    UI.HeaderInfo : {
        TypeName : 'User',
        TypeNamePlural : 'Users',
        Title : { Value : email },
        Description : { Value : '{firstName} {lastName}' },
    },
    UI.Identification : [
        {
            $Type : 'UI.DataFieldForAction',
            Action : 'UserManagementService.deactivateUserMain',
            Label : 'Deactivate',
            @UI.Hidden: {
                $edmJson: {
                    $Or: [
                        {
                            $Not: {
                                $Path: '/auth/canUpdate'
                            }
                        },
                        {
                            $Not: {
                                $Path: 'active'
                            }
                        },
                        {
                            $Not: {
                                $Path: 'IsActiveEntity'
                            }
                        }
                    ]
                }
            }
        }
    ],
    UI.FieldGroup #GeneratedGroup : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Value : email,
                Label : 'Email',
            },
            {
                $Type : 'UI.DataField',
                Value : firstName,
                Label : 'First Name',
            },
            {
                $Type : 'UI.DataField',
                Value : lastName,
                Label : 'Last Name',
            },
            {
                $Type : 'UI.DataField',
                Value : createdBy,
                Label : 'Created By',
            },
            {
                $Type : 'UI.DataField',
                Value : createdAt,
                Label : 'Created At',
            },
            {
                $Type : 'UI.DataField',
                Value : modifiedBy,
                Label : 'Modified By',
            },
            {
                $Type : 'UI.DataField',
                Value : modifiedAt,
                Label : 'Modified At',
            },
            {
                $Type : 'UI.DataField',
                Value : active,
                Label : 'Active',
            },
        ],
    },
    UI.Facets : [
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'GeneratedFacet1',
            Label : 'General Information',
            Target : '@UI.FieldGroup#GeneratedGroup',
        },
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'CustomerAsstsFacet',
            Label : 'Customer Assignments',
            Target : 'customers/@UI.LineItem#Customers',
            @UI.Hidden: {
                $edmJson: {
                    $Not: {
                        $Or: [
                            {
                                $Eq: [
                                    { $Path: 'userGroupIndicator' },
                                    'C'
                                ]
                            },
                            {
                                $Eq: [
                                    { $Path: 'userGroupIndicator' },
                                    'SC'
                                ]
                            }
                        ]
                    }
                }
            }
        },
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'SupplierAsstsFacet',
            Label : 'Supplier Assignments',
            Target : 'suppliers/@UI.LineItem#Suppliers',
            @UI.Hidden: {
                $edmJson: {
                    $Not: {
                        $Or: [
                            {
                                $Eq: [
                                    { $Path: 'userGroupIndicator' },
                                    'S'
                                ]
                            },
                            {
                                $Eq: [
                                    { $Path: 'userGroupIndicator' },
                                    'SC'
                                ]
                            }
                        ]
                    }
                }
            }
        },
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'UserGroupFacet',
            Label : 'User Groups',
            Target : 'groups/@UI.LineItem#UserGroups',
        },
    ],
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Value : email,
            Label : 'Email',
        },
        {
            $Type : 'UI.DataField',
            Value : firstName,
            Label : 'First Name',
        },
        {
            $Type : 'UI.DataField',
            Value : lastName,
            Label : 'Last Name',
        },
        {
            $Type : 'UI.DataField',
            Value : createdBy,
            Label : 'Created By',
        },
        {
            $Type : 'UI.DataField',
            Value : createdAt,
            Label : 'Created At',
        },
        {
            $Type : 'UI.DataField',
            Value : active,
            Label : 'Status',
        },
        {
            $Type : 'UI.DataField',
            Value : userGroupIndicator,
            Label : 'User Group',
        },
        {
            $Type : 'UI.DataFieldForAction',
            Action : 'UserManagementService.deactivateUserMain',
            Label : 'Deactivate',
        },
    ],
    UI.SelectionFields : [
        email,
        firstName,
        lastName,
        groups.groupName,
        active,
    ],
    UI.CreateHidden : {
        $edmJson: {
            $Not: { $Path: '/auth/canCreate' }
        }
    },

    // UI.UpdateHidden : {
    //     $edmJson: {
    //         $Not: { $Path: '/auth/canUpdate' }
    //     }
    // },
    UI.UpdateHidden : {
        $edmJson: {
            $Or: [
                {
                    $Not: {
                        $Path: '/auth/canUpdate'
                    }
                },
                {
                    $Not: {
                        $Path: 'active'
                    }
                }
            ]
        }
    },
    UI.DeleteHidden : {
        $edmJson: {
            $Not: { $Path: '/auth/canDelete' }
        }
    },
    Capabilities: {
        NavigationRestrictions : {
            $Type : 'Capabilities.NavigationRestrictionsType',
            RestrictedProperties : [
                {
                    $Type : 'Capabilities.NavigationPropertyRestriction',
                    NavigationProperty : DraftAdministrativeData,
                    FilterRestrictions : {
                        $Type : 'Capabilities.FilterRestrictionsType',
                        Filterable : false,
                    },
                },
            ],
        },
    }
);

annotate service.UserGroups with @(
    Capabilities: {
        InsertRestrictions: {Insertable: false},
        DeleteRestrictions: {Deletable: false},
        UpdateRestrictions: {Updatable: false}
    },
    UI.LineItem #UserGroups: [
        {
            $Type : 'UI.DataField',
            Value : groupId,
            Label : 'Group Id',
        },
        {
            $Type : 'UI.DataField',
            Value : groupName,
            Label : 'Group Name',
        }
    ]
);

annotate service.PartnerAssignments with @Common.SideEffects: {
    SourceProperties: [
        'partnerId',
        'partnerType'
    ],
    TargetEntities: [
        {
            $NavigationPropertyPath: 'projects'
        }
    ]
};

annotate service.PartnerAssignments with @(
    UI.LineItem #Customers: [
        {
            $Type : 'UI.DataField',
            Value : partnerId,
            Label : 'Customer ID',
        },
    ],
    UI.LineItem #Suppliers: [
        {
            $Type : 'UI.DataField',
            Value : partnerId,
            Label : 'Supplier ID',
        },
    ]
);

annotate service.PartnerAssignments:partnerId with @(
    Common.ValueList: {
        CollectionPath: 'BusinessPartnerVH',

        Parameters: [
            {
                $Type: 'Common.ValueListParameterInOut',
                LocalDataProperty: partnerId,
                ValueListProperty: 'partnerId'
            },
            {
                $Type: 'Common.ValueListParameterOut',
                ValueListProperty: 'partnerName',
                LocalDataProperty: partnerName
            },
            {
                $Type: 'Common.ValueListParameterIn',
                ValueListProperty: 'partnerType',
                LocalDataProperty: partnerType
            },
            {
                $Type: 'Common.ValueListParameterIn',
                ValueListProperty: 'userEmail',
                LocalDataProperty: ID
            }
        ],

        Label: 'Customer ID'
    },

    Common.ValueListWithFixedValues: false,
    Common.ValueListForValidation: true
);
annotate service.BusinessPartnerVH with @(
    UI.SelectionFields: [
        partnerId,
        partnerName
    ]
);

annotate service.BusinessPartnerVH with {
    partnerId @title: 'Partner ID';
    partnerName @title: 'Partner Name';
};
annotate service.Users with {
    firstName @Common.Label : '{i18n>First Name}'
};

annotate service.Users with {
    lastName @Common.Label : '{i18n>Last Name}'
};

annotate service.UserGroups with {
    groupName @Common.Label : 'Group Name'
};

annotate service.Users with {
    active @Common.Label : 'Active'
};

