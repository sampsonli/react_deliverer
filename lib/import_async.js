"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (function (_ref) {
    var template = _ref.template;
    var buildImport1 = template("(\n        new Promise((resolve) => {\n            require.ensure([], (require) => {\n                 const result = require(SOURCE);\n                 resolve(result);\n                 if(module.hot) {\n                    Promise.resolve().then(() => {\n                        typeof result.onUpdate === 'function' && module.hot.accept(SOURCE, () => {\n                            result.onUpdate(require(SOURCE));\n                        });\n                    })\n                 }\n            }, MODEL);\n        })\n    )");
    var buildImport2 = template("(\n        new Promise((resolve) => {\n            require.ensure([], (require) => {\n                 const result = require(SOURCE);\n                 resolve(result);\n                 if(module.hot) {\n                     Promise.resolve().then(() => {\n                        typeof result.onUpdate === 'function' && module.hot.accept(SOURCE, () => {\n                            result.onUpdate(require(SOURCE));\n                        });\n                     })\n                 }\n            });\n        })\n    )");
    var getChunkName = function (arg) {
        if (arg.trailingComments && arg.trailingComments[0].value.indexOf('webpackChunkName:')) {
            return arg.trailingComments[0].value.replace('webpackChunkName:', '').replace(/\s/g, '').replace(/["|']/g, '');
        }
        if (arg.leadingComments && arg.leadingComments[0].value.indexOf('webpackChunkName:')) {
            return arg.leadingComments[0].value.replace('webpackChunkName:', '').replace(/\s/g, '').replace(/["|']/g, '');
        }
        if (!~arg.value.indexOf('/')) {
            return arg.value;
        }
        return null;
    };
    return {
        manipulateOptions: function (opts, parserOpts) {
            parserOpts.plugins.push('dynamicImport');
        },
        visitor: {
            Import: function (path) {
                var newImport;
                var trunkName = getChunkName(path.parentPath.node.arguments[0]);
                if (trunkName) {
                    newImport = buildImport1({
                        SOURCE: path.parentPath.node.arguments,
                        MODEL: [{ type: 'StringLiteral', value: trunkName }],
                    });
                }
                else {
                    newImport = buildImport2({
                        SOURCE: path.parentPath.node.arguments,
                    });
                }
                path.parentPath.replaceWith(newImport);
            },
        },
    };
});
//# sourceMappingURL=import_async.js.map