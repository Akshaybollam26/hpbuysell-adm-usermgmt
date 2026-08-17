sap.ui.define([
    "sap/ui/model/Filter", "sap/ui/model/FilterOperator", "sap/m/Token", "sap/m/Text", "sap/m/Column", "sap/m/ColumnListItem", "sap/ui/table/Column"
], function (Filter, FilterOperator, Token, Text, Column, ColumnListItem, UITableColumn) {
    "use strict";
    const Handler = {
        _oMultiInput: null,
        onValueHelpRequest: function (oEvent) {
            Handler._oMultiInput = oEvent.getSource();
            const oModel = Handler._oMultiInput.getModel(),
                bSupplier = Handler._oMultiInput.getId().indexOf("Supplier") >= 0,
                sTitle = bSupplier ? "Select Suppliers" : "Select Customers",
                sPath = bSupplier ? "/SupplierMaster" : "/CustomerMaster",
                sKey = bSupplier ? "supplierId" : "customerId",
                sText = bSupplier ? "supplierName" : "customerName";
            debugger;
            sap.ui.require(["sap/ui/comp/valuehelpdialog/ValueHelpDialog"], function (ValueHelpDialog) {
                const oDialog = new ValueHelpDialog({
                    title: sTitle,
                    supportMultiselect: true,
                    supportRanges: false,
                    key: sKey,
                    descriptionKey: sText,
                    ok: function (oEvent) {
                        const aTokens = oEvent.getParameter("tokens") || [];
                        Handler._oMultiInput.setTokens(aTokens);
                        Handler._updateFilterValue(aTokens);
                        oDialog.close();
                    },
                    cancel: function () { oDialog.close(); },
                    afterClose: function () { oDialog.destroy(); }
                });
                oDialog.setTokens(Handler._oMultiInput.getTokens().map(function (oToken) {
                    return new Token({ key: oToken.getKey() });
                }));
                oDialog.setModel(oModel);
                oDialog.getTableAsync().then(function (oTable) {
                    oTable.setModel(oModel);
                    if (oTable.bindRows) {
                        oTable.removeAllColumns();
                        oTable.addColumn(new UITableColumn({
                            label: new Text({ text: bSupplier ? "Supplier ID" : "Customer ID" }),
                            template: new Text({ text: "{" + sKey + "}" }),
                            sortProperty: sKey,
                            filterProperty: sKey
                        }));
                        oTable.addColumn(new UITableColumn({
                            label: new Text({ text: bSupplier ? "Supplier Name" : "Customer Name" }),
                            template: new Text({ text: "{" + sText + "}" }),
                            sortProperty: sText,
                            filterProperty: sText
                        }));
                        oTable.bindRows({ path: sPath });
                    } else {
                        oTable.removeAllColumns();
                        oTable.addColumn(new Column({ header: new Text({ text: bSupplier ? "Supplier ID" : "Customer ID" }) }));
                        oTable.addColumn(new Column({ header: new Text({ text: bSupplier ? "Supplier Name" : "Customer Name" }) }));
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
        onTokenUpdate: function (oEvent) {
            setTimeout(function () { Handler._updateFilterValue(oEvent.getSource().getTokens()); }, 0);
        },
        _updateFilterValue: function (aTokens) {
            Handler._oMultiInput.setValue(aTokens.map(function (oToken) { return oToken.getKey(); }).join(","));
        },

        /*
         * Two separate filter functions, one per navigation path.
         * filterItems (used by CustFilter.fragment.xml's MultiInput)
         * was previously hardcoded to "customers/partnerId" - which is
         * why the Supplier filter's selections never matched anything
         * when its formatOptions.operator also happened to resolve to
         * this same function. Point SuppFilter.fragment.xml's
         * formatOptions.operator at filterSupplierItems instead - see
         * note below.
         */
        filterItems: function (sValue) {
            return Handler._buildFilter(sValue, "customers/partnerId");
        },

        filterCustomerItems: function (sValue) {
            return Handler._buildFilter(sValue, "customers/partnerId");
        },

        filterSupplierItems: function (sValue) {
            return Handler._buildFilter(sValue, "suppliers/partnerId");
        },

        _buildFilter: function (sValue, sPath) {
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
        }
    };
    return Handler;
});