//#region Imports
import "css!./q2g-ext-selectorExtension.css";
import * as qvangular from "qvangular";
import * as qlik from "qlik";
import * as template from "text!./q2g-ext-selectorExtension.html";
import * as langDE from "text!./translate/de-DE/propertypanel.js";
import * as langEN from "text!./translate/en-US/propertypanel.js";

import { utils, logging, services, version } from "./node_modules/davinci.js/dist/umd/daVinci";
import { SelectionsDirectiveFactory } from "./q2g-ext-selectorDirective";
//#endregion

//#region registrate services
qvangular.service<services.ITranslateProvider>("$translateProvider", services.TranslateProvider)
    .translations("en", langEN)
    .translations("de", langDE)
    .determinePreferredLanguage();

let $translate = qvangular.service<services.ITranslateService>("$translate", services.TranslateService);

qvangular.service<services.IRegistrationProvider>("$registrationProvider", services.RegistrationProvider)
.implementObject(qvangular);
//#endregion

//#region Logger
logging.LogConfig.SetLogLevel("*", logging.LogLevel.info);
let logger = new logging.Logger("Main");
//#endregion

//#region registrate directives
var $injector = qvangular.$injector;
utils.checkDirectiveIsRegistrated($injector, qvangular, "", SelectionsDirectiveFactory("Selectionextension"),
    "SelectionExtension");
//#endregion

//#region set extension parameters
let parameter = {
    type: "items",
    component: "accordion",
    items: {
        dimensions: {
            uses: "dimensions",
            min: 0
        },
        settings: {
            uses: "settings",
            items: {
                accessibility: {
                    type: "items",
                    label: "Accessibility",
                    grouped: true,
                    items: {
                        shortcuts: {
                            type: "items",
                            lable: "shortcuts",
                            grouped: false,
                            items: {
                                ShortcutLable: {
                                    label: "In the following, you can change the used shortcuts",
                                    component: "text"
                                },
                                shortcutUseDefaults: {
                                    ref: "properties.shortcutUseDefaults",
                                    label: "use default shortcuts",
                                    component: "switch",
                                    type: "boolean",
                                    options: [{
                                        value: true,
                                        label: "use"
                                    }, {
                                        value: false,
                                        label: "not use"
                                    }],
                                    defaultValue: true
                                },
                                shortcutFocusDimensionList: {
                                    ref: "properties.shortcutFocusDimensionList",
                                    label: "focus dimension list",
                                    type: "string",
                                    defaultValue: "strg + alt + 70",
                                    show: function (data: any) {
                                        if (data.properties.shortcutUseDefaults) {
                                            data.properties.shortcutFocusDimensionList = "strg + alt + 70";
                                        }
                                        return !data.properties.shortcutUseDefaults;
                                    }
                                },
                                shortcutFocusSearchField: {
                                    ref: "properties.shortcutFocusSearchField",
                                    label: "focus search field",
                                    type: "string",
                                    defaultValue: "strg + alt + 83",
                                    show: function (data: any) {
                                        if (data.properties.shortcutUseDefaults) {
                                            data.properties.shortcutFocusSearchField = "strg + alt + 83";
                                        }
                                        return !data.properties.shortcutUseDefaults;
                                    }
                                },
                                shortcutFocusValueList: {
                                    ref: "properties.shortcutFocusValueList",
                                    label: "focus value list",
                                    type: "string",
                                    defaultValue: "strg + alt + 87",
                                    show: function (data: any) {
                                        if (data.properties.shortcutUseDefaults) {
                                            data.properties.shortcutFocusValueList = "strg + alt + 87";
                                        }
                                        return !data.properties.shortcutUseDefaults;
                                    }
                                },
                                shortcutClearSelection: {
                                    ref: "properties.shortcutClearSelection",
                                    label: "delete selction",
                                    type: "string",
                                    defaultValue: "strg + alt + 76",
                                    show: function (data: any) {
                                        if (data.properties.shortcutUseDefaults) {
                                            data.properties.shortcutClearSelection = "strg + alt + 76";
                                        }
                                        return !data.properties.shortcutUseDefaults;
                                    }
                                }
                            }
                        },
                        arialive: {
                            type: "items",
                            lable: "arialive",
                            grouped: false,
                            items: {
                                configLable: {
                                    label: "In the following, you can change Settings",
                                    component: "text"
                                },
                                useAccessibility: {
                                    ref: "properties.aria.useAccessibility",
                                    label: "use accessibility",
                                    component: "switch",
                                    type: "boolean",
                                    options: [{
                                        value: true,
                                        label: "use"
                                    }, {
                                        value: false,
                                        label: "not use"
                                    }],
                                    defaultValue: false
                                },
                                timeAria: {
                                    ref: "properties.aria.timeAria",
                                    label: "Timeinterval for hints",
                                    type: "string",
                                    defaultValue: "7000",
                                    show: function (data: any) {
                                        return data.properties.useAccessibility;
                                    }
                                },
                                actionDelay: {
                                    ref: "properties.aria.actionDelay",
                                    label: "Delay bevor action (used for Aria Live Regions)",
                                    type: "string",
                                    defaultValue: "100",
                                    show: function (data: any) {
                                        return data.properties.useAccessibility;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};
//#endregion

class SelectionExtension {

    model: EngineAPI.IGenericObject;

    constructor(model: EngineAPI.IGenericObject) {
        this.model = model;
    }

    public isEditMode() {
        if (qlik.navigation.getMode() === "analysis") {
            return false;
        } else {
            return true;
        }
    }
}

export = {
    definition: parameter,
    initialProperties: { },
    template: template,
    support: {
        snapshot: false,
        export: true,
        exportData: false
    },
    paint: () => {
        //
    },
    resize: () => {
        //
    },
    controller: ["$scope", function (scope: utils.IVMScope<SelectionExtension>) {
        console.log("Extension is using daVinci.js Verions: " + version);
        scope.vm = new SelectionExtension(utils.getEnigma(scope));
    }]
};




