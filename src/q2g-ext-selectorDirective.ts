
//#region Imports
import { Logging } from "./lib/daVinci.js/src/utils/logger";
import { ListViewDirectiveFactory, IDataModelItem } from "./lib/daVinci.js/src/directives/listview";
import { ScrollBarDirectiveFactory } from "./lib/daVinci.js/src/directives/scrollBar";
import { StatusTextDirectiveFactory } from "./lib/daVinci.js/src/directives/statusText";
import { ExtensionHeaderDirectiveFactory } from "./lib/daVinci.js/src/directives/extensionHeader";
import { ShortCutDirectiveFactory } from "./lib/daVinci.js/src/directives/shortcut";
import { IdentifierDirectiveFactory } from "./lib/daVinci.js/src/directives/identifier";
import { Q2gListAdapter, Q2gListObject, Q2gDimensionObject } from "./lib/daVinci.js/src/utils/object";

import * as utils from "./lib/daVinci.js/src/utils/utils";
import * as template from "text!./q2g-ext-selectorDirective.html";
// import * as qlik from "qlik";
//#endregion

//#region Logger
let logger = new Logging.Logger("q2g-ext-selectorDrective");
//#endregion

//#region interfaces
interface IVMScope<T> extends ExtensionAPI.IExtensionScope {
    vm: T;
}

interface IShortcutProperties {
    shortcutFocusDimensionList: string;
    shortcutFocusSearchField: string;
    shortcutFocusValueList: string;
    shortcutClearSelection: string;
}
//#endregion

//#region assist classes
class ListsInformation {
    maxNumberOfRows: number = 0;
    numberOfVisibleRows: number = 0;
}

class DataModel {
    dimensionList: Array<IDataModelItem> = [];
    dimensionListBackup: Array<IDataModelItem> = [];
    valueList: Array<IDataModelItem> = [];
}
//#endregion

class SelectionsController implements ng.IController {

    $onInit(): void {
        logger.debug("initial Run of SelectionsController");
    }

    //#region Variables
    element: JQuery;
    timeout: ng.ITimeoutService;
    dimensionList: Q2gListAdapter;
    valueList: Q2gListAdapter;
    statusText: string;
    timeAriaIntervall: number = 0;
    actionDelay: number = 0;
    properties: IShortcutProperties = {
        shortcutFocusDimensionList: " ",
        shortcutFocusSearchField: " ",
        shortcutFocusValueList: " ",
        shortcutClearSelection: " ",
    };
    useReadebility: boolean = false;
    titleDimension: string = "Dimensions";
    titleValues: string = "no Dimension Selected";
    showFocusedValue: boolean = false;
    showFocusedDimension: boolean = false;
    menuListDimension: Array<any>;
    menuListValues: Array<any>;
    showSearchFieldDimension: boolean = false;
    showSearchFieldValues: boolean = false;

    private selectedDimensionDefs: Array<string> = [];
    private selectedDimension: string = "";
    private engineGenericObjectVal: EngineAPI.IGenericObject;
    //#endregion

    //#region egineRoot
    private _engineroot: EngineAPI.IGenericObject;
    get engineroot(): EngineAPI.IGenericObject {
        return this._engineroot;
    }
    set engineroot(value: EngineAPI.IGenericObject) {
        if (value !== this._engineroot) {
            try {
                logger.info("val", value);
                this._engineroot = value;
                let that = this;
                this.engineroot.on("changed", function () {
                    this.getLayout().then((res: EngineAPI.IGenericObjectProperties) => {

                        that.getProperties(res.properties);

                        if (!that.dimensionList) {
                            that.dimensionList = new Q2gListAdapter(
                                new Q2gDimensionObject(
                                    new utils.AssistHypercube(res)),
                                utils.calcNumbreOfVisRows(that.elementHeight),
                                res.qHyperCube.qDimensionInfo.length
                            );
                        } else {
                            that.dimensionList.updateList(
                                new Q2gDimensionObject(
                                    new utils.AssistHypercube(res)),
                                utils.calcNumbreOfVisRows(that.elementHeight),
                                res.qHyperCube.qDimensionInfo.length);


                        }
                    });
                });
                this.engineroot.emit("changed");
            } catch (e) {
                logger.error("error", e);
            }
        }
    }
    //#endregion

    //#region elementHeight
    private _elementHeight: number = 0;
    get elementHeight(): number {
        return this._elementHeight;
    }
    set elementHeight(value: number) {
        if (this.elementHeight !== value) {
            try {
                this._elementHeight = value;

                if (this.dimensionList) {
                    this.dimensionList.obj.emit("changed", utils.calcNumbreOfVisRows(this.elementHeight));
                } else {
                    this.timeout(() => {
                        this.dimensionList.obj.emit("changed", utils.calcNumbreOfVisRows(this.elementHeight));
                    }, 200);
                }
                if (this.valueList && this.valueList.obj) {
                    this.valueList.obj.emit("changed", utils.calcNumbreOfVisRows(this.elementHeight));
                }
            } catch (err) {
                console.error("error in setter of elementHeight", err);
            }
        }
    }
    //#endregion

    //#region focusedPositionDimension
    private _focusedPositionDimension: number = -1;
    get focusedPositionDimension(): number {
        return this._focusedPositionDimension;
    }
    set focusedPositionDimension(newVal: number) {
        if (newVal !== this._focusedPositionDimension) {
            if (this._focusedPositionValues !== -1) {
                this.dimensionList.itemsPagingTopSetPromise(
                        this.calcPagingStart(newVal, this.dimensionList.itemsPagingTop, this.dimensionList))
                    .then(() => {
                        this._focusedPositionDimension = newVal;
                    })
                    .catch((e: Error) => {
                        logger.error("ERROR in Setter of absolutPosition");
                    });
                return;
            }
            this._focusedPositionDimension = newVal;
        }
    }
    //#endregion

    //#region focusedPositionValues
    private _focusedPositionValues: number = -1;
    get focusedPositionValues(): number {
        return this._focusedPositionValues;
    }
    set focusedPositionValues(newVal: number) {
        if (newVal !== this._focusedPositionValues && this.valueList) {
            if (this._focusedPositionValues !== -1) {
                if (newVal >= this.valueList.itemsPagingTop &&
                    newVal <= this.valueList.itemsPagingTop + this.valueList.itemsPagingHeight - 1) {

                    this._focusedPositionValues = newVal;
                } else {
                    this.valueList.itemsPagingTopSetPromise(this.calcPagingStart(newVal, this.focusedPositionValues, this.valueList))
                        .then(() => {
                            this._focusedPositionValues = newVal;
                        })
                        .catch((e: Error) => {
                            logger.error("ERROR in Setter of absolutPosition");
                        });
                    return;
                }
            }
            this._focusedPositionValues = newVal;
        }
    }
    //#endregion

    //#region textSearchDimension Promise Row needs to be changed !!!!
    private _textSearchDimension: string = "";
    get textSearchDimension(): string {
        return this._textSearchDimension;
    }
    set textSearchDimension(value: string) {
        if (value !== this.textSearchDimension) {
            try {
                this._textSearchDimension = value;
                if (!value) {
                    this.dimensionList.obj.searchFor("").then(() => {
                        this.dimensionList.obj.emit("changed", utils.calcNumbreOfVisRows(this.elementHeight));
                        this.dimensionList.itemsCounter = (this.dimensionList.obj as any).model.calcCube.length;
                        this.timeout();
                    });
                    return;
                }

                this.dimensionList.itemsPagingTop = 0;
                this.dimensionList.obj.searchFor(value).then(() => {
                    this.dimensionList.obj.emit("changed", utils.calcNumbreOfVisRows(this.elementHeight));
                    this.dimensionList.itemsCounter = (this.dimensionList.obj as any).model.calcCube.length;
                    this.timeout();
                });

            } catch (err) {
                logger.error("error in setter of textSearchValue", err);
            }
        }
    }
    //#endregion

    //#region textSearchValue
    private _textSearchValue: string = "";
    get textSearchValue(): string {
        return this._textSearchValue;
    }
    set textSearchValue(value: string) {
        if (value !== this.textSearchValue) {
            try {
                this.valueList.itemsPagingTop = 0;
                this._textSearchValue = value;
                if (!value) {
                    this.valueList.obj.searchFor("").then(() => {
                        return this.engineGenericObjectVal.getLayout();
                    }).then((res: EngineAPI.IGenericObjectProperties) => {
                        this.valueList.itemsCounter = res.qListObject.qDimensionInfo.qCardinal;
                    }).catch((e: Error) => {
                        logger.error("ERROR in Setter of textSearchValue", e);
                    });
                    return;
                }

                this.valueList.itemsPagingTop = 0;
                this.valueList.obj.searchFor(value).then(() => {


                    return this.engineGenericObjectVal.getLayout();
                }).then((res: EngineAPI.IGenericObjectProperties) => {
                    this.valueList.itemsCounter = res.qListObject.qDimensionInfo.qCardinal;
                }).catch((e: Error) => {
                    logger.error("ERROR in Setter of textSearchValue", e);
                });
            } catch (err) {
                logger.error("error in setter of textSearchValue");
            }
        }
    }
    //#endregion

    //#region showButtonsDimension
    private _showButtonsDimension: boolean = false;
    get showButtonsDimension(): boolean {
        return this._showButtonsDimension;
    }
    set showButtonsDimension(value: boolean) {
        if (this._showButtonsDimension !== value) {
            this._showButtonsDimension = value;
            if (value) {
                this.showButtonsValue = false;
            }
        }
    }
    //#endregion

    //#region showButtonsValue
    private _showButtonsValue: boolean = false;
    get showButtonsValue(): boolean {
        return this._showButtonsValue;
    }
    set showButtonsValue(value: boolean) {
        if (this._showButtonsValue !== value) {
            this._showButtonsValue = value;
            if (value) {
                this.showButtonsDimension = false;
            }
        }
    }
    //#endregion

    static $inject = ["$timeout", "$element", "$scope"];

    /**
     * init of the controller for the Direction Directive
     * @param timeout
     * @param element
     */
    constructor(timeout: ng.ITimeoutService, element: JQuery, scope: ng.IScope) {
        this.element = element;
        this.timeout = timeout;

        this.initMenuElements();

        $(document).on("click", (e: JQueryEventObject) => {
            try {
                if (element.children().children().children().children(".dimensionList").find(e.target).length === 0) {
                    this.showFocusedDimension = false;
                    this.showButtonsDimension = false;
                    this.showSearchFieldDimension = false;
                    this.timeout();
                }

                if (element.children().children().children().children(".valueList").find(e.target).length === 0) {
                    this.showFocusedValue = false;
                    this.showButtonsValue = false;
                    this.showSearchFieldValues = false;
                    this.timeout();
                }
            } catch (e) {
                logger.error("Error in Constructor with click event", e);
            }
        });

        scope.$watch(() => {
            return this.element.width();
        }, () => {
            this.elementHeight = this.element.height();
        });
    }

    /**
     * fills the Menu with Elements
     */
    private initMenuElements(): void {
        this.menuListDimension = [];
        this.menuListValues = [];
        this.menuListValues.push({
            type: "success",
            isVisible: true,
            isEnabled: true,
            icon: "tick",
            name: "Confirm Selection",
            hasSeparator: false,

        });
        this.menuListValues.push({
            type: "danger",
            isVisible: true,
            isEnabled: false,
            icon: "close",
            name: "Cancle Selection",
            hasSeparator: true
        });
        this.menuListValues.push({
            type: "",
            isVisible: true,
            isEnabled: true,
            icon: "clear-selections",
            name: "clear",
            hasSeparator: false
        });
        this.menuListValues.push({
            type: "",
            isVisible: true,
            isEnabled: true,
            icon: "select-all",
            name: "Select all",
            hasSeparator: false
        });
        this.menuListValues.push({
            type: "",
            isVisible: true,
            isEnabled: false,
            icon: "select-possible",
            name: "Select possible",
            hasSeparator: false
        });
        this.menuListValues.push({
            type: "",
            isVisible: true,
            isEnabled: true,
            icon: "select-alternative",
            name: "Select alternative",
            hasSeparator: false
        });
        this.menuListValues.push({
            type: "",
            isVisible: true,
            isEnabled: true,
            icon: "select-excluded",
            name: "Select excluded",
            hasSeparator: false
        });
    }

    /**
     * function which gets called, when the buttons of the menu list gets hit
     * @param item neme of the nutton which got activated
     */
    menuListActionCallback(item: string) {
        switch (item) {
            case "accept":
                this.showButtonsValue = false;
                this.showSearchFieldValues = false;
                this.engineGenericObjectVal.endSelections(true);
                break;
            case "cancel":
                this.showButtonsValue = false;
                this.showSearchFieldValues = false;
                this.engineGenericObjectVal.endSelections(false);
                break;
            case "clear":
                this.engineGenericObjectVal.clearSelections("/qListObjectDef");
                break;
            case "Select all":
                this.engineGenericObjectVal.selectListObjectAll("/qListObjectDef");
                break;
            case "Select possible":
                this.engineGenericObjectVal.selectListObjectPossible("/qListObjectDef");
                break;
            case "Select alternative":
                this.engineGenericObjectVal.selectListObjectAlternative("/qListObjectDef");
                break;
            case "Select excluded":
                this.engineGenericObjectVal.selectListObjectExcluded("/qListObjectDef");
                break;
        }
    }

    /**
     * creates a new session object for the selected dimension
     * @param pos position of the selected extension in the displayed list
     */
    selectDimensionObjectCallback(pos: number): void {
        logger.debug("function selectDimensionObjectCallback", "");
        try {
            if (this.selectedDimension !== this.dimensionList.collection[pos].title) {
                setTimeout(() => {
                    this.showFocusedDimension = true;

                    for (let x of this.dimensionList.collection) {
                        x.status = "A";
                    }

                    // dimension
                    this.selectedDimension = this.dimensionList.collection[pos].title;
                    this.selectedDimensionDefs = this.dimensionList.collection[pos].defs;
                    this.focusedPositionDimension = pos + this.dimensionList.itemsPagingTop;
                    this.dimensionList.collection[pos].status = "S";

                    // values
                    this.valueList = null;
                    this._focusedPositionValues = 0;
                    this.createValueListSessionObjcet(this.selectedDimension, this.selectedDimensionDefs);
                    this.textSearchValue = "";
                    this.titleValues = this.dimensionList.collection[pos].title;
                    // others
                    this.statusText = "Dimension " + this.dimensionList.collection[pos].title + " gewählt";

                }, this.actionDelay);

            }
        } catch (err) {
            logger.error("ERROR in selectDimension", err);
        }
    }

    /**
     * callback when selecting Value in the value List
     * @param pos position from the selected Value
     */
    selectListObjectCallback(pos: number, event?: JQueryKeyEventObject): void {
        let assistItemsPagingTop = this.valueList.itemsPagingTop;
        setTimeout(() => {
            this.showFocusedValue = true;
            this.showButtonsValue = true;

            this.engineGenericObjectVal.selectListObjectValues(
                "/qListObjectDef", [this.valueList.collection[pos].id], (event && event.ctrlKey) ? false : true)
                .then(() => {
                    this.focusedPositionValues = pos + this.valueList.itemsPagingTop;
                    this.valueList.itemsPagingTop = assistItemsPagingTop;
                    this.statusText = "Dimension " + this.valueList.collection[pos].title + " gewählt";
                }).catch((err: Error) => {
                    logger.error("ERROR in selectListObjectCallback", err);
                });
        }, this.actionDelay);
    }

    /**
     * creates the session object for the selected dimension by dimension name
     * @param dimensionName name of the diminsion the new session object should be create for
     */
    private createValueListSessionObjcet(dimensionName: string, dimensionFieldDefs: Array<string>): void {
        if (this.engineGenericObjectVal) {
            this.engineroot.app.destroySessionObject(this.engineGenericObjectVal.id)
                .then(() => {
                    this.createValueListSessionObjectAssist(dimensionName, dimensionFieldDefs);
                })
                .catch((err: Error) => {
                    logger.error("Error in createValueListSessionObjcet", err);
                });
        } else {
            this.createValueListSessionObjectAssist(dimensionName, dimensionFieldDefs);
        }
    }

    /** TO DO vorhandener list Object den Feldwert ändern -> folgend muss alles sich von alleine neuberechne
     * creates the session object for the selected dimension by dimension name assist
     * @param dimensionName name of the diminsion the new session object should be create for
     * @param dimensionFieldDefs definition of the diminsion the new session object should be create for
     */
    private createValueListSessionObjectAssist(dimensionName: string, dimensionFieldDefs: Array<string>): void {
        var parameter: EngineAPI.IGenericObjectProperties = {
            "qInfo": {
                "qType": "ListObject"
            },
            "qListObjectDef": {
                "qStateName": "$",
                "qLibraryId": "",
                "qDef": {
                    "qFieldDefs": dimensionFieldDefs,
                    "qGrouping": "N",
                    "autoSort": false,
                    "qActiveField": 0,
                    "qFieldLabels": [dimensionName],
                    "qSortCriterias": [{
                        "qSortByState": 1,
                        "qSortByAscii": 1
                    }]
                },
                "qAutoSortByState": {
                    "qDisplayNumberOfRows": -1
                },
                "qFrequencyMode": "EQ_NX_FREQUENCY_NONE",
                "qShowAlternatives": true,
                "qInitialDataFetch": [
                    {
                        "qTop": 0,
                        "qLeft": 0,
                        "qHeight": 0,
                        "qWidth": 1
                    }
                ]
            },
            "description": "Description of the list object"
        };


        this.engineroot.app.createSessionObject(parameter)
            .then((genericObject: EngineAPI.IGenericObject) => {
                this.engineGenericObjectVal = genericObject;

                genericObject.getLayout().then((res: EngineAPI.IGenericObjectProperties) => {

                    this.valueList = new Q2gListAdapter(
                        new Q2gListObject(
                            genericObject),
                        utils.calcNumbreOfVisRows(this.elementHeight),
                        res.qListObject.qDimensionInfo.qCardinal
                    );

                    let that = this;
                    genericObject.on("changed", function () {
                        that.valueList.obj.emit("changed", utils.calcNumbreOfVisRows(that.elementHeight));
                    });
                    genericObject.emit("changed");
                });
            })
            .catch((err: Error) => {
                logger.error("ERROR", err);
            });
    }

    /**
     * calculates the new Paging Start Position when absolut position is out of Paging size
     * @param newVal the new Value of the focusedPosition
     * @param focusedPosition the old value of the focusedPosition
     * @param object the list object, in which the changes shoud be done
     */
    private calcPagingStart(newVal: number, focusedPosition: number, object: Q2gListAdapter): number {

        // absolutPosition out of sight below
        if (focusedPosition < object.itemsPagingTop && focusedPosition >= 0) {
            return newVal;
        }

        // absolutPosition out of sight above
        if (focusedPosition > object.itemsPagingTop + utils.calcNumbreOfVisRows(this.elementHeight)) {
            return newVal - utils.calcNumbreOfVisRows(this.elementHeight) + 1;
        }

        // absolutPosition steps out of page below
        if (newVal < object.itemsPagingTop) {
            return object.itemsPagingTop - 1;
        }

        // absolutPosition steps out of page above
        if (newVal >= object.itemsPagingTop + utils.calcNumbreOfVisRows(this.elementHeight)) {
            return object.itemsPagingTop + 1;
        }

        return object.itemsPagingTop;
    }

    /**
     * shortcuthandler to clears the made selection
     * @param objectShortcut object wich gives you the shortcut name and the element, from which the shortcut come from
     */
    shortcutHandler(objectShortcut: any): boolean {
        logger.debug("function shortcutHandler", objectShortcut.objectShortcut.name);

        switch (objectShortcut.objectShortcut.name) {

            case "focusDimensionList":
                try {
                    this.showFocusedDimension = true;
                    this.showFocusedValue = false;
                    this.timeout();
                    if (this.focusedPositionDimension < 0) {
                        this.focusedPositionDimension = 0;
                        objectShortcut.element.children().children().children()[0].focus();
                        this.timeout();
                        return true;
                    }

                    if (this.focusedPositionDimension >= this.dimensionList.collection.length) {
                        this.focusedPositionDimension = 0;
                        objectShortcut.element.children().children().children()[0].focus();
                        this.timeout();
                        return true;
                    }

                    if (this.focusedPositionDimension < this.dimensionList.itemsPagingTop) {
                        this.dimensionList.itemsPagingTop = this.focusedPositionDimension;
                    } else if (this.focusedPositionDimension >
                        this.dimensionList.itemsPagingTop + utils.calcNumbreOfVisRows(this.elementHeight)) {
                        this.dimensionList.itemsPagingTop
                            = this.focusedPositionDimension - (utils.calcNumbreOfVisRows(this.elementHeight) + 1);

                    }

                    objectShortcut.element.children().children().children().children()[
                        this.focusedPositionDimension - this.dimensionList.itemsPagingTop
                    ].focus();
                    return true;
                } catch (e) {
                    logger.error("Error in shortcut Handler", e);
                    return false;
                }

            case "focusSearchDimension":
                try {
                    this.showFocusedDimension = false;
                    this.timeout();
                    objectShortcut.element.focus();
                    return true;
                } catch (e) {
                    logger.error("Error in shortcut Handler", e);
                    return false;
                }

            case "clearselection":
                this.textSearchDimension = "";
                this.textSearchValue = "";
                this.engineroot.app.clearAll(true).then(() => {
                    this.statusText = "Selektionen wurden gelöscht";
                }).catch((e: Error) => {
                    logger.error("error in shortcutHandlerClear", e);
                    });
                return true;

            case "focusSearchValue":
                this.showFocusedValue = false;
                objectShortcut.element.focus();
                return true;

            case "focusValueList":
                this.showFocusedDimension = false;
                this.showFocusedValue = true;
                this.timeout();
                if (this.valueList.collection) {
                    if (this.focusedPositionValues < 0 ||
                        this.focusedPositionValues >= this.valueList.collection.length ||
                        this.focusedPositionValues >= utils.calcNumbreOfVisRows(this.elementHeight) + this.valueList.itemsPagingTop) {
                        this.focusedPositionValues = 0;
                        this.valueList.itemsPagingTop = 0;
                        objectShortcut.element.children().children().children().children()[0].focus();
                        this.timeout();
                        return true;
                    }

                    if (this.focusedPositionValues < this.valueList.itemsPagingTop) {
                        this.valueList.itemsPagingTop = this.focusedPositionValues;
                    } else if (this.focusedPositionValues > this.valueList.itemsPagingTop + utils.calcNumbreOfVisRows(this.elementHeight)) {
                        this.valueList.itemsPagingTop = this.focusedPositionValues - (utils.calcNumbreOfVisRows(this.elementHeight) + 1);
                    }
                    objectShortcut.element.children().children().children().children()[
                        this.focusedPositionValues - this.valueList.itemsPagingTop
                    ].focus();
                }
                return true;

            case "escape":
                if (this.textSearchDimension.length > 0 || this.textSearchValue.length > 0) {
                    if (objectShortcut.element.parent().find(":focus").length > 0) {
                        switch (objectShortcut.element[0].getAttribute("ng-model")) {
                            case "vm.textSearchDimension":
                                this.textSearchDimension = "";
                                break;
                            case "vm.textSearchValue":
                                this.textSearchValue = "";
                                break;
                        }
                    } else {
                        objectShortcut.element.blur();
                    }
                }
                return true;

            case "acceptSearch":
                setTimeout(() => {
                    this.engineGenericObjectVal.acceptListObjectSearch("/qListObjectDef", true)
                        .then(() => {
                            this.statusText = "Alle gesuchten Werte gewählt";
                        }).catch((err: Error) => {
                            logger.error("ERROR in selectListObjectCallback", err);
                        });
                }, this.actionDelay);
                return true;

            case "escDimension":
                try {
                    if (this.textSearchDimension === "") {
                        this.showSearchFieldDimension = false;
                    }
                    return true;
                } catch (e) {
                    logger.error("Error in shortcutHandlerExtensionHeader", e);
                    return false;
                }

            case "escValues":
                try {
                    if (this.textSearchValue === "") {
                        this.showSearchFieldValues = false;
                    }
                    return true;
                } catch (e) {
                    logger.error("Error in shortcutHandlerExtensionHeader", e);
                    return false;
                }
        }
        return false;
    }

    /**
     * checks if the extension is used in Edit mode
     */
    // public isEditMode(): boolean {
    //    if (qlik.navigation.getMode() === "analysis") {
    //        return false;
    //    } else {
    //        return true;
    //    }
    // }

    /**
     * saves the Properties from the getLayout call from qlik enine in own Object
     * @param properties Properties from getLayout call
     */
    private getProperties(properties: any): void {
        this.properties.shortcutFocusDimensionList = properties.shortcutFocusDimensionList;
        this.properties.shortcutFocusValueList = properties.shortcutFocusValueList;
        this.properties.shortcutFocusSearchField = properties.shortcutFocusSearchField;
        this.properties.shortcutClearSelection = properties.shortcutClearSelection;

        if (properties.useAccessibility) {
            this.timeAriaIntervall = parseInt(properties.timeAria, 10);
            this.actionDelay = parseInt(properties.actionDelay, 10);
        }

        this.useReadebility = properties.useAccessibility;

    }
}

export function SelectionsDirectiveFactory(rootNameSpace: string): ng.IDirectiveFactory {
    "use strict";
    return ($document: ng.IAugmentedJQuery, $injector: ng.auto.IInjectorService, $registrationProvider: any) => {
        return {
            restrict: "E",
            replace: true,
            template: utils.templateReplacer(template, rootNameSpace),
            controller: SelectionsController,
            controllerAs: "vm",
            scope: {},
            bindToController: {
                engineroot: "<"
            },
            compile: ():void => {
                utils.checkDirectiveIsRegistrated($injector, $registrationProvider, rootNameSpace, ListViewDirectiveFactory(rootNameSpace),
                    "Listview");
                utils.checkDirectiveIsRegistrated($injector, $registrationProvider, rootNameSpace, ScrollBarDirectiveFactory(rootNameSpace),
                    "ScrollBar");
                utils.checkDirectiveIsRegistrated($injector, $registrationProvider, rootNameSpace,
                    StatusTextDirectiveFactory(rootNameSpace),"StatusText");
                utils.checkDirectiveIsRegistrated($injector, $registrationProvider, rootNameSpace, ShortCutDirectiveFactory(rootNameSpace),
                    "Shortcut");
                utils.checkDirectiveIsRegistrated($injector, $registrationProvider, rootNameSpace,
                    IdentifierDirectiveFactory(rootNameSpace), "AkquinetIdentifier");
                utils.checkDirectiveIsRegistrated($injector, $registrationProvider, rootNameSpace,
                    ExtensionHeaderDirectiveFactory(rootNameSpace), "ExtensionHeader");
            }
        };
    };
}

