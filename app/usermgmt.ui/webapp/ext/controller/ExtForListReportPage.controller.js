//-----------------------------------------------------------------------------------*
// Confidential and Proprietary
// Copyright 2026, HP
// All Rights Reserved
//-----------------------------------------------------------------------------------*
// Application Name :    User Managment Application
// WRICEF No        :
// Release          :
// Author           :    Meer Arfat Ali/Akshay Bollam
// Created Date     :    02.09.2026
// Description      :    User Managment Application
//-----------------------------------------------------------------------------------*
//Change Log:
//    Date      |   Author      |   Defect/Incident     |   Change Description
//-----------------------------------------------------------------------------------*/


sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/util/File"
], function (
    ControllerExtension,
    Filter,
    FilterOperator,
    MessageToast,
    MessageBox,
    File
) {
    "use strict";

    return ControllerExtension.extend(
        "hpbuysell.adm.usermgmt.ui.ext.controller.ExtForListReportPage",
        {
            // Fiori Elements hook
            onBeforeRebindTable: function (oEvent) {
                var oCollectionBindingInfoAPI = oEvent.getParameter("collectionBindingInfo");

                const oFilterBar = this.base.getView().byId("fe::FilterBar::Users");
                const oFilterItems = oFilterBar.getFilterItems();

                var aProjectIds = [];

                var oMultiInput = this.base.getView()
                    .byId("hpbuysell.adm.usermgmt.ui::UsersList--fe::FilterBar::Users::CustomFilterField::filterbarFieldForProjects")
                    .getCurrentContent()[0]
                    .getContent();

                if (!oMultiInput) {
                    return;
                }

                var aTokens = oMultiInput.getTokens();
                var sTypedValue = oMultiInput.getValue().trim().toUpperCase();
 
                if (!aTokens.length && !sTypedValue) {
                    return;
                }
                if(aTokens.length){
                    aProjectIds = aTokens.map(function (oToken) {
                        return oToken.getKey();
                    });
                }
                sTypedValue && aProjectIds.push(sTypedValue);

                aProjectIds = aTokens.map(function (oToken) {
                    return oToken.getKey();
                });
                aProjectIds.push(sTypedValue);

                var aInnerOrFilters = aProjectIds.map(function (sId) {
                    return new Filter("pj/projectId", FilterOperator.EQ, sId);
                });

                var oInnerAny = new Filter({
                    filters: aInnerOrFilters,
                    and: false
                });

                var oCustomersAny = new Filter({
                    path: "customers",
                    operator: FilterOperator.Any,
                    variable: "pa",
                    condition: new Filter({
                        path: "pa/projects",
                        operator: FilterOperator.Any,
                        variable: "pj",
                        condition: oInnerAny
                    })
                });

                var oSuppliersAny = new Filter({
                    path: "suppliers",
                    operator: FilterOperator.Any,
                    variable: "pa",
                    condition: new Filter({
                        path: "pa/projects",
                        operator: FilterOperator.Any,
                        variable: "pj",
                        condition: oInnerAny
                    })
                });

                var oOuterOr = new Filter({
                    filters: [oCustomersAny, oSuppliersAny],
                    and: false
                });

                oCollectionBindingInfoAPI.addFilter(oOuterOr);
            },

            /**
             * Custom export handler
             */
            _handleCustomExcelExport: function (oEvent) {
                // Prevent standard export
                oEvent.preventDefault();
                var oView = this.base.getView();
                var oModel = this.base.getExtensionAPI().getModel();

                if (!oModel) {
                    MessageBox.error("Application runtime data model could not be found.");
                    return;
                }

                var oTable = oEvent.getSource();
                var aEmails = [];
                var aSelectedContexts = oTable.getSelectedContexts();

                if (aSelectedContexts && aSelectedContexts.length > 0) {
                    aEmails = aSelectedContexts.map(function (oContext) {
                        return oContext.getProperty("email");
                    });
                }

                var oActionContext = oModel.bindContext("/exportUsers(...)");
                oActionContext.setParameter("emails", aEmails);

                oView.setBusy(true);

                oActionContext.execute().then(function () {

                    oView.setBusy(false);

                    var oResult = oActionContext.getBoundContext().getObject();

                    if (oResult && oResult.base64) {

                        var sBinaryString = window.atob(oResult.base64);
                        var iLen = sBinaryString.length;
                        var oBytes = new Uint8Array(iLen);

                        for (var i = 0; i < iLen; i++) {
                            oBytes[i] = sBinaryString.charCodeAt(i);
                        }

                        var sFileName = oResult.fileName || "UserExport.xlsx";

                        File.save(
                            oBytes.buffer,
                            sFileName.replace(".xlsx", ""),
                            "xlsx",
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        );

                        MessageToast.show("Custom Excel report downloaded successfully.");

                    } else {
                        MessageBox.error("Backend did not return valid Excel file base64 content.");
                    }

                }.bind(this)).catch(function (oError) {

                    oView.setBusy(false);

                    var sMsg = oError.message ||
                        "An error occurred while compiling your Excel export.";

                    MessageBox.error("Export Processing Failed: " + sMsg);
                });
            },

            override: {
                onInit: function () {

                    // Existing initialization
                    var oModel = this.base.getExtensionAPI().getModel();

                    var oView = this.base.getView();

                    // Force FE initialization
                    if (this.base && this.base.getExtensionAPI()) {
                        this.base.getExtensionAPI().getIntentBasedNavigation();
                    }

                    // Locate MDC table
                    var oTable = oView.findAggregatedObjects(true, function (oObj) {
                        return oObj.isA && oObj.isA("sap.ui.mdc.Table");
                    })[0];

                    if (oTable) {

                        oTable.attachBeforeExport(
                            this._handleCustomExcelExport.bind(this)
                        );
                    } else {

                        setTimeout(function () {

                            var oDelayedTable = oView.findAggregatedObjects(true, function (oObj) {
                                return oObj.isA && oObj.isA("sap.ui.mdc.Table");
                            })[0];

                            if (oDelayedTable) {

                                oDelayedTable.attachBeforeExport(
                                    this._handleCustomExcelExport.bind(this)
                                );
                            }

                        }.bind(this), 500);
                    }
                }
            }
        }
    );
});