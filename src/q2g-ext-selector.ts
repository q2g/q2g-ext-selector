/// <reference path="lib/daVinci.js/src/utils/utils.ts" />

//#region Imports 
import "css!./q2g-ext-selector.css";
import * as qvangular from "qvangular";
import * as template from "text!./q2g-ext-selector.html";
import * as langDE from "text!./translate/de-DE/propertypanel.js";
import * as langEN from "text!./translate/en-US/propertypanel.js";

import { Logging } from "./lib/daVinci.js/src/utils/logger";
import { SelectionsDirectiveFactory } from "./q2g-ext-selectorDirective";
import { getEnigma, checkDirectiveIsRegistrated } from "./lib/daVinci.js/src/utils/utils";
import { TranslateProvider, ITranslateProvider, TranslateService, ITranslateService } from "./lib/daVinci.js/src/services/translate";
//#endregion

class AngularAssistProvider {
    directive;
    filter;
    service;

    constructor() {// object und schaut ob er diese hat (directive filter)
        this.directive = qvangular.directive;
        this.filter = qvangular.filter;
        this.service = qvangular.service;
    }
}

qvangular.service<ITranslateProvider>("$translateProvider", TranslateProvider)
    .translations("en", langEN)
    .translations("de", langDE)
    .determinePreferredLanguage();

let $translate = qvangular.service<ITranslateService>("$translate", TranslateService);


qvangular.service("$registrationProvider", AngularAssistProvider);

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
let shortcutFocusDimensionList: string = "strg + alt + 70";
let shortcutFocusSearchField: string = "strg + alt + 83";
let shortcutFocusValueList: string = "strg + alt + 87";
let shortcutClearSelection: string = "strg + alt + 76";

let parameter = {
    type: "items",
    component: "accordion",
    items: {
        dimensions: {
            uses: "dimensions"
        },
        settings: {
            uses: "settings",
            items: {
                accessibility: {
                    type: "items",
                    label: "accessibility",
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
                                    defaultValue: shortcutFocusDimensionList,
                                    show: function (data: any) {
                                        if (data.properties.shortcutUseDefaults) {
                                            data.properties.shortcutFocusDimensionList = shortcutFocusDimensionList;
                                        }
                                        return !data.properties.shortcutUseDefaults;
                                    }
                                },
                                shortcutFocusSearchField: {
                                    ref: "properties.shortcutFocusSearchField",
                                    label: "focus search field",
                                    type: "string",
                                    defaultValue: shortcutFocusSearchField,
                                    show: function (data: any) {
                                        if (data.properties.shortcutUseDefaults) {
                                            data.properties.shortcutFocusSearchField = shortcutFocusSearchField;
                                        }
                                        return !data.properties.shortcutUseDefaults;
                                    }
                                },
                                shortcutFocusValueList: {
                                    ref: "properties.shortcutFocusValueList",
                                    label: "focus value list",
                                    type: "string",
                                    defaultValue: shortcutFocusValueList,
                                    show: function (data: any) {
                                        if (data.properties.shortcutUseDefaults) {
                                            data.properties.shortcutFocusValueList = shortcutFocusValueList;
                                        }
                                        return !data.properties.shortcutUseDefaults;
                                    }
                                },
                                shortcutClearSelection: {
                                    ref: "properties.shortcutClearSelection",
                                    label: "delete selction",
                                    type: "string",
                                    defaultValue: shortcutClearSelection,
                                    show: function (data: any) {
                                        if (data.properties.shortcutUseDefaults) {
                                            data.properties.shortcutClearSelection = shortcutClearSelection;
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
                                    ref: "properties.useAccessibility",
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
                                    ref: "properties.timeAria",
                                    label: "Timeinterval for hints",
                                    type: "string",
                                    defaultValue: "7000",
                                    show: function (data: any) {
                                        return data.properties.useAccessibility;
                                    }
                                },
                                actionDelay: {
                                    ref: "properties.actionDelay",
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
    constructor(enigmaRoot: EngineAPI.IGenericObject) {
        logger.debug("Constructor of Selection Extension", "");

        this.engineRoot = enigmaRoot;
    }

    engineRoot: EngineAPI.IGenericObject;

}

export = {
    definition: parameter,
    initialProperties: { },
    template: template,
    controller: ["$scope", function (
        scope: IVMScope<SelectionExtension>) {
        scope.vm = new SelectionExtension(getEnigma(scope));
    }]
}


