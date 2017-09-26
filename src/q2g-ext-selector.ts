/// <reference path="lib/daVinci.js/src/utils/utils.ts" />

//#region Imports
import "css!./q2g-ext-selector.css";
import * as qvangular from "qvangular";
import * as qlik from "qlik";
import * as template from "text!./q2g-ext-selector.html";
import * as langDE from "text!./translate/de-DE/propertypanel.js";
import * as langEN from "text!./translate/en-US/propertypanel.js";

import { Logging } from "./lib/daVinci.js/src/utils/logger";
import { SelectionsDirectiveFactory } from "./q2g-ext-selectorDirective";
import { getEnigma, checkDirectiveIsRegistrated } from "./lib/daVinci.js/src/utils/utils";
import { TranslateProvider, ITranslateProvider, TranslateService, ITranslateService } from "./lib/daVinci.js/src/services/translate";
import { RegistrationProvider, IRegistrationProvider } from "./lib/daVinci.js/src/services/registration";
//#endregion


qvangular.service<ITranslateProvider>("$translateProvider", TranslateProvider)
    .translations("en", langEN)
    .translations("de", langDE)
    .determinePreferredLanguage();

let $translate = qvangular.service<ITranslateService>("$translate", TranslateService);

qvangular.service<IRegistrationProvider>("$registrationProvider", RegistrationProvider)
    .implementObject(qvangular);

//#region Logger
Logging.LogConfig.SetLogLevel("*", Logging.LogLevel.info);
let logger = new Logging.Logger("Main");
//#endregion

//#region Directives
var $injector = qvangular.$injector;
checkDirectiveIsRegistrated($injector, qvangular, "", SelectionsDirectiveFactory("Selectionextension"),
    "SelectionExtension");
//#endregion

//#region assist classes
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
                    label: $translate.instant("properties.accessibility"),
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
    constructor(model: EngineAPI.IGenericObject) {
        logger.debug("Constructor of Selection Extension", "");

        this.model = model;
    }

    model: EngineAPI.IGenericObject;

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
    support : {
        export: true
    },
    controller: ["$scope", function (
        scope: IVMScope<SelectionExtension>) {
        logger.debug("Initialice Extension");
        scope.vm = new SelectionExtension(getEnigma(scope));
    }]
};


