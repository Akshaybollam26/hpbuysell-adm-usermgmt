sap.ui.define([
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/Token",
    "sap/m/Popover",
    "sap/m/List",
    "sap/m/StandardListItem",
    "sap/m/PlacementType"
], function (Fragment, MessageToast, JSONModel, Filter, FilterOperator, Token, Popover, List, StandardListItem, PlacementType) {
    'use strict';
 
    return {
        /**
         * Generated event handler.
         *
         * @param oEvent the event object provided by the event provider.
         */
        onPress: async function (oEvent) {
            //read unassigned projects from the db and set model and display in dialog
            const oController = this._controller;
            const oModel = oController.getView().getModel();
            // const oContext = oEvent.getSource().getBindingContext();
            this._oPartnerAssignmentContext = oEvent.getSource().getBindingContext();
            const oPartner = this._oPartnerAssignmentContext.getObject();
 
            // Partner has not been selected yet
            if (!oPartner.partnerId || !oPartner.ID) {
                MessageToast.show("Please select a partner before managing projects.");
                return;
            }
            const sPartnerId = oPartner.partnerId;
            this._sPartnerUuid = oPartner.ID;
            const isActiveEntity = oPartner.IsActiveEntity !== false;
            try {
                const oOperation = oModel.bindContext(`/findSelectedProjects(...)`);
                oOperation.setParameter("partnerID", this._sPartnerUuid);
                oOperation.setParameter("isActiveEntity", isActiveEntity);
                await oOperation.execute();
                const aProjects = oOperation.getBoundContext().getObject().value;
                this._aInitialProjectsList = aProjects.map(project => ({ ...project }));
                oController.getView().setModel(new JSONModel(aProjects), "projects");
            } catch (oError) {
                // MessageToast.show("Unable to load or find projects related to selected partner");
                MessageToast.show("No Projects found for the selected Partner");
                return;
            }
            if (!this._oManageProjectsDialog) {
                this._oManageProjectsDialog = await this.loadFragment({
                    name: "hpbuysell.adm.usermgmt.ui.ext.fragment.ManageProjectsDialog"
                });
            }
            this._oManageProjectsDialog.open();
        },
        onListTokenRendering: function(oEvent){
            oEvent.preventDefault(); // suppress default token-text popover
            const oTokenizer = oEvent.getSource();

            if (!this._oProjectsPopover) {
                this._oProjectsPopover = new Popover({
                    placement: PlacementType.Auto,
                    content: new List({
                        items: {
                            path: "projects",
                            template: new StandardListItem({
                                title: "{= ${projectName} + ' (' + ${projectId} + ')' }"
                            })
                        }
                    })
                }).addStyleClass("sapUiContentPadding");

                this._controller.getView().addDependent(this._oProjectsPopover);
            }

            this._oProjectsPopover.setBindingContext(oTokenizer.getBindingContext());
            this._oProjectsPopover.openBy(oTokenizer);
        },
        onSearchProjects: async function (oEvent) {
            const sValue = oEvent.getParameter("newValue");
            const oTable = oEvent.getSource().getParent().getContent()[1];
            // SearchField is first child, Table is second
 
            const oBinding = oTable.getBinding("items");
            if (!sValue) {
                oBinding.filter([]);
                return;
            }
            oBinding.filter([
                new Filter("projectId", FilterOperator.Contains, sValue)
            ]);
        },
        onOkProjects: async function (oEvent) {
            var oController = this._controller;
            var oModel = oController.getView().getModel();
            
            const aChangedProjectList = oController.getView().getModel("projects").oData;
            const aSelectedProjectsIds = aChangedProjectList.filter(p => p.selected === true).map(p => p.wbselement);
            const aUnselectedProjectsIds = aChangedProjectList.filter(p => p.selected === false).map(p => p.wbselement);
            const aInitialSelectedProjectIds = this._aInitialProjectsList.filter(p => p.selected === true).map(p => p.wbselement);
 
            const aProjectsToAdd = aSelectedProjectsIds.filter(id => !aInitialSelectedProjectIds.includes(id));
            const aProjectsToRemove = aUnselectedProjectsIds.filter(id => aInitialSelectedProjectIds.includes(id));
 
            const isActiveEntity = this._oPartnerAssignmentContext.getObject().IsActiveEntity !== false;
            try {
                if (aProjectsToAdd.length) {
                    await oModel.bindContext("/addProjects(...)")
                        .setParameter("partnerID", this._sPartnerUuid)
                        .setParameter("isActiveEntity", isActiveEntity)
                        .setParameter("projectIds", aProjectsToAdd)
                        .execute();
 
                    await this._oPartnerAssignmentContext.requestSideEffects([{ $NavigationPropertyPath: "projects" }]);
                }
                if (aProjectsToRemove.length) {
                    await oModel.bindContext("/removeProjects(...)")
                        .setParameter("partnerID", this._sPartnerUuid)
                        .setParameter("isActiveEntity", isActiveEntity)
                        .setParameter("projectIds", aProjectsToRemove)
                        .execute();
 
                    await this._oPartnerAssignmentContext.requestSideEffects([{ $NavigationPropertyPath: "projects" }]);
                }
                MessageToast.show("Projects updated successfully");
            } catch (oError) {
                MessageToast.show("Unable to update projects");
                console.error(oError);
                return;
            }
 
            this._oManageProjectsDialog.close();
            this._oManageProjectsDialog.destroy();
            this._oManageProjectsDialog = null;
        },
        onSelectAll: function (oEvent) {
            // 1. Get the table reference relative to the button event
            const oButton = oEvent.getSource();
            const oDialog = oButton.getParent().getParent(); // Toolbar -> Content -> Dialog
            const oTable = oDialog.getContent()[1]; // Index 1 is the Table
 
            if (oTable) {
                // Select all rows in the UI table control
                oTable.selectAll();
            }
 
            // 2. Sync the underlying JSON model data
            const oController = this._controller;
            const oModel = oController.getView().getModel("projects");
 
            if (oModel) {
                const aData = oModel.getData();
                if (Array.isArray(aData)) {
                    aData.forEach(function (oProject) {
                        oProject.selected = true;
                    });
                    oModel.refresh(true);
                }
            }
        },
        onClearAll: function (oEvent) {
            const oButton = oEvent.getSource();
            const oDialog = oButton.getParent().getParent();
            const oTable = oDialog.getContent()[1];
            if (oTable) {
                oTable.removeSelections(true);
            }
            const oController = this._controller;
            const oModel = oController.getView().getModel("projects");
            if (oModel) {
                const aData = oModel.getData();
                if (Array.isArray(aData)) {
                    aData.forEach(function (oProject) {
                        oProject.selected = false;
                    });
                    oModel.refresh(true);
                }
            }
        },
        onCancelDialog: function (oEvent) {
            this._oManageProjectsDialog.close();
            this._oManageProjectsDialog.destroy();
            this._oManageProjectsDialog = null;
        },
        onVHRequestForProjects: async function(oEvent){
            const oCommonSrvModel = this._controller.getView().getModel("commonServiceModel");
            this._multiInputField = oEvent.getSource();
            if (!this.vhdForProjectsFilter) {
                this.vhdForProjectsFilter = await sap.ui.core.Fragment.load({
                    name: "hpbuysell.adm.usermgmt.ui.ext.fragment.VHDForProjectsFbField",
                    controller : this
                });
                this._controller.getView().addDependent(this.vhdForProjectsFilter);
                this.vhdForProjectsFilter.setContentHeight("80%");
                this.vhdForProjectsFilter.setModel(oCommonSrvModel);
                var oTable = new sap.m.Table({
                    mode: sap.m.ListMode.MultiSelect,
                    columns: [
                        new sap.m.Column({
                            header: new sap.m.Text({
                                text: "Project Id"
                            })
                        }),
                        new sap.m.Column({
                            header: new sap.m.Text({
                                text: "Project Name"
                            })
                        }),
                        new sap.m.Column({
                            header: new sap.m.Text({
                                text: "Company Code"
                            })
                        })
                    ]
                });
                oTable.setModel(oCommonSrvModel);
                oTable.bindItems({
                    path: "/ProjectCompanyVH",
                    template: new sap.m.ColumnListItem({
                        cells: [
                            new sap.m.Text({
                                text: "{wbselement}"
                            }),
                            new sap.m.Text({
                                text: "{wbsdescription}"
                            }),
                            new sap.m.Text({
                                text: "{companycode}"
                            })
                        ]
                    })
                });
 
                this.vhdForProjectsFilter.setTable(oTable);
            }
            this.vhdForProjectsFilter.open();
        },
        onVHDForProjectFilter_Search: function(oEvent){
            var oFilterBar = oEvent.getSource();
            var aFilterbarItems = oFilterBar.getFilterGroupItems();
            var sProjectId, sCompanyCode, aFilters = [];
            aFilterbarItems.forEach(function (oItem) {
                var sName = oItem.getName();
                var sValue = oItem.getControl().getValue().trim();
 
                if (sName === "projectId") {
                    sProjectId = sValue;
                } else if (sName === "companyCode") {
                    sCompanyCode = sValue;
                }
            });
            sProjectId &&  aFilters.push(new sap.ui.model.Filter("wbselement", sap.ui.model.FilterOperator.Contains, sProjectId));
            sCompanyCode &&  aFilters.push(new sap.ui.model.Filter("companycode", sap.ui.model.FilterOperator.Contains, sCompanyCode));
            var oTable = this.vhdForProjectsFilter.getTable();
            if(!oTable)
                return
            else    
                var oBinding = oTable.getBinding("items");
            oBinding && oBinding.filter(aFilters);
 
            //get values present inside filter items and create filters of them
            //refresh binding of the table while passing filters
        },
        vhdForProjects_onOK: function(oEvent){
            // const oTable = this.vhdForProjectsFilter.getContent()[0];
            // const aSelectedItems = oTable.getSelectedItems();
            var aSelectedTokens = oEvent.getParameter("tokens") || [];
            // const aTokens = aSelectedItems.map(oItem => {
            //     const sId = oItem.getCells()[0].getText();
            //     const sName = oItem.getCells()[1].getText();
            //     return new Token({ key: sId, text: sId });
            // });
            var that = this;
            aSelectedTokens.forEach(function (oToken) {
                var sKey = oToken.getKey();
                var sText = oToken.getText();
                // Prevent duplicate projects in MultiInput
                var bAlreadyExists = that._multiInputField.getTokens().some(function (oExistingToken) {
                    return oExistingToken.getKey() === sKey;
                });
                if (!bAlreadyExists) {
                    that._multiInputField.addToken(
                        new sap.m.Token({
                            key: sKey,
                            text: sText
                        })
                    );
                }
            });
            // this._multiInputField.setTokens(aTokens);
            // this._updateFilterValue(aTokens);
            // const sValue = aTokens.map(t => t.getKey()).join(",");
            //this._oMultiInput.setValue(sValue); // triggers the "Value" type conversion -> filterItems()
 
            this.vhdForProjectsFilter.close();
            this.vhdForProjectsFilter.destroy();
            this.vhdForProjectsFilter = null;
        },
        vhdForProjects_onCancel: function(oEvent){
            this.vhdForProjectsFilter.close();
            this.vhdForProjectsFilter.destroy();
            this.vhdForProjectsFilter = null;
        }
    };
});
 