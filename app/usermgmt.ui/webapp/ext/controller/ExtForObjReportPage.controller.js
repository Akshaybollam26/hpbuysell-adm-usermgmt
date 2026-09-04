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


sap.ui.define(['sap/ui/core/mvc/ControllerExtension'], function (ControllerExtension) {
	'use strict';

	return ControllerExtension.extend('hpbuysell.adm.usermgmt.ui.ext.controller.ExtForObjReportPage', {
		// this section allows to extend lifecycle hooks or hooks provided by Fiori elements
		override: {
			/**
			 * Called when a controller is instantiated and its View controls (if available) are already created.
			 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
			 * @memberOf hpbuysell.adm.usermgmt.ui.ext.controller.ExtForObjReportPage
			 */
			onInit: function () {
				// you can access the Fiori elements extensionAPI via this.base.getExtensionAPI
			}
		}
	});
});
