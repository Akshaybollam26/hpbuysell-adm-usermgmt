sap.ui.define([
    "sap/ui/model/Filter", "sap/ui/model/FilterOperator", "sap/m/Token", "sap/m/Text", "sap/m/Column", "sap/m/ColumnListItem", "sap/ui/table/Column"
], function (Filter, FilterOperator, Token, Text, Column, ColumnListItem, UITableColumn) {
    "use strict";
    const Handler = {
        _oMultiInput: null,
        onValueHelpRequest: function (oEvent) {
            Handler._oMultiInput = oEvent.getSource();
            const oModel = this._controller.getView().getModel("commonServiceModel"),
                sTitle = "Select Suppliers",
                sPath = "commonServiceModel>/SupplierVH",
                sKey = "commonServiceModel>supplierid",
                sText = "commonServiceModel>suppliername";
            sap.ui.require(["sap/ui/comp/valuehelpdialog/ValueHelpDialog"], function (ValueHelpDialog) {
                const oDialog = new ValueHelpDialog({
                    title: sTitle,
                    supportMultiselect: true,
                    supportRanges: false,
                    key: "supplierid",
                    descriptionKey: "suppliername",
                    ok: function (oEvent) {
                        const aTokens = oEvent.getParameter("tokens") || [];
                        Handler._oMultiInput.setTokens(aTokens);
                        Handler._updateFilterValue(aTokens);
                        // Handler._buildFilter("","suppliers/partnerId");
                        oDialog.close();
                    },
                    cancel: function () { oDialog.close(); },
                    afterClose: function () { oDialog.destroy(); }
                });
                oDialog.setTokens(Handler._oMultiInput.getTokens().map(function (oToken) {
                    return new Token({ key: oToken.getKey() });
                }));
                oDialog.setModel(oModel, "commonServiceModel");
                oDialog.getTableAsync().then(function (oTable) {
                    oTable.setModel(oModel, "commonServiceModel");
                    if (oTable.bindRows) {
                        oTable.removeAllColumns();
                        oTable.addColumn(new UITableColumn({
                            label: new Text({ text: "Supplier ID" }),
                            template: new Text({ text: "{" + sKey + "}" }),
                            sortProperty: "supplierid",
                            filterProperty: "supplierid"
                        }));
                        oTable.addColumn(new UITableColumn({
                            label: new Text({ text: "Supplier Name" }),
                            template: new Text({ text: "{" + sText + "}" }),
                            sortProperty: "suppliername",
                            filterProperty: "suppliername"
                        }));
                        oTable.bindRows({ path: sPath });
                    } else {
                        oTable.removeAllColumns();
                        oTable.addColumn(new Column({ header: new Text({ text: "Supplier ID" }) }));
                        oTable.addColumn(new Column({ header: new Text({ text: "Supplier Name" }) }));
                        oTable.bindItems({
                            path: sPath,
                            template: new ColumnListItem({
                                cells: [
                                    new Text({ text: "{" + sKey + "}" }),
                                    new Text({ text: "{" + sText + "}" })
                                ]
                            })
                        });
                    }
                    oDialog.update();
                });
                oDialog.open();
            });
        },
        onLiveChangeOfS: function(oEvent){
            if(!Handler._oMultiInput)
                Handler._oMultiInput = oEvent.getSource();
        },
        onTokenUpdate: function (oEvent) {
            setTimeout(function () { Handler._updateFilterValue(oEvent.getSource().getTokens()); }, 0);
        },
        _updateFilterValue: function (aTokens) {
            Handler._oMultiInput.setValue(aTokens.map(function (oToken) { return oToken.getKey(); }).join(","));
        },

        /*
         * Filters on suppliers/partnerId - NOT customers/partnerId.
         * This is what was missing: this file previously either had no
         * filterItems implementation matching this path, or still
         * referenced the customer navigation path copied from
         * CustFilter.js.
         */
        filterItems: function (sValue) {
            return Handler._buildFilter(sValue, "suppliers/partnerId");
        },
        _buildFilter: function(sValue, sPath){
            if (!sValue) return null;
            const aIds = sValue.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
            if (!aIds.length) return null;
            return new Filter({
                filters: aIds.map(function (sId) {
                    return new Filter({
                        path: sPath,
                        operator: FilterOperator.EQ,
                        value1: sId
                    });
                }),
                and: false
            });
            // const aTokens = Handler._oMultiInput.getTokens();
            // if (!aTokens.length && !sValue) {
            //     return null;
            // }
            // var aFilters = aTokens.map(function (oToken) {
            //     return new Filter({
            //         path: sPath,
            //         operator: FilterOperator.EQ,
            //         value1: oToken.getKey()
            //     });
            // });
            // sValue && aFilters.push(new Filter({ path: sPath, operator: FilterOperator.EQ, value1: sValue }));
            // return new Filter({
            //     filters: aFilters,
            //     and: false
            // });
        }
    };
    return Handler;
});
