sap.ui.define(['sap/ui/core/mvc/ControllerExtension'], function (ControllerExtension) {
	'use strict';

	return ControllerExtension.extend('hpbuysell.adm.usermgmt.ui.ext.controller.ExtForObjReportPage', {
		// this section allows to extend lifecycle hooks or hooks provided by Fiori elements
		_attachRefreshOnPatch: function (oTable) {
			if (!oTable || oTable._hasPatchRefreshAttached) {
				return;
			}

			var oListBinding = oTable.getRowBinding && oTable.getRowBinding();

			if (!oListBinding) {
				return;
			}

			oTable._hasPatchRefreshAttached = true;

			oListBinding.attachPatchCompleted(function (oEvent) {
				var bSuccess = oEvent.getParameter("success");
				if (bSuccess) {
					oListBinding.refresh();
				}
			});
		},

		_wireTables: function () {
			var oView = this.base.getView();

			var aTables = oView.findAggregatedObjects(true, function (oObj) {
				return oObj.isA && oObj.isA("sap.ui.mdc.Table") &&
					(oObj.getId().indexOf("Customers") >= 0 || oObj.getId().indexOf("Suppliers") >= 0);
			});

			if (aTables && aTables.length) {
				aTables.forEach(this._attachRefreshOnPatch.bind(this));
			} else {
				// Tables may not be rendered yet on first pass - retry once.
				setTimeout(function () {
					var aDelayedTables = oView.findAggregatedObjects(true, function (oObj) {
						return oObj.isA && oObj.isA("sap.ui.mdc.Table") &&
							(oObj.getId().indexOf("Customers") >= 0 || oObj.getId().indexOf("Suppliers") >= 0);
					});
					aDelayedTables.forEach(this._attachRefreshOnPatch.bind(this));
				}.bind(this), 500);
			}
		},
		override: {
			/**
			 * Called when a controller is instantiated and its View controls (if available) are already created.
			 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
			 * @memberOf hpbuysell.adm.usermgmt.ui.ext.controller.ExtForObjReportPage
			 */
			onInit: function () {
				// you can access the Fiori elements extensionAPI via this.base.getExtensionAPI
				this._wireTables();
			}
		}
	});
});
