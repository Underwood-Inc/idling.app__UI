"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const declaration_spacing_1 = __importDefault(require("./rules/declaration-spacing"));
const link_target_blank_1 = __importDefault(require("./rules/link-target-blank"));
const plugin = {
    rules: {
        'link-target-blank': link_target_blank_1.default,
        'declaration-spacing': declaration_spacing_1.default
    }
};
module.exports = plugin;
//# sourceMappingURL=index.js.map