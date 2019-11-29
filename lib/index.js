"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var redux_1 = require("redux");
var _store = undefined;
var _asyncReducers = {};
function injectReducer(key, reducer) {
    if (_store) {
        if (_asyncReducers[key] && !module.hot) {
            console.error('模块命名重复，可能会引发未知错误');
        }
        _asyncReducers[key] = reducer;
        _store.replaceReducer(redux_1.combineReducers(__assign({}, _asyncReducers)));
    }
    else {
        throw new Error('deliverer 未初始化, 请先调用 deliverer(store)');
    }
}
function connect(ns) {
    return function (clazz) {
        return function () {
            var result = new clazz();
            result.ns = ns;
            var actions = clazz.prototype.__actions || {};
            var mutations = {};
            Object.keys(actions).forEach(function (func) {
                mutations[ns + "/" + func] = actions[func];
            });
            var reducer = function (state, _a) {
                if (state === void 0) { state = JSON.parse(JSON.stringify(result)); }
                var type = _a.type, payload = _a.payload;
                if (mutations[type]) {
                    var curr = __assign({}, state);
                    var modify_1 = mutations[type].bind(curr)(payload, curr) || curr;
                    var diff = Object.keys(modify_1).some(function (key) { return modify_1[key] !== state[key]; });
                    if (diff) {
                        state = modify_1;
                        for (var key in state) {
                            result[key] = state[key];
                        }
                    }
                }
                return state;
            };
            injectReducer(ns, reducer);
            var rootState = _store.getState();
            var state = rootState[ns];
            if (state) { // 老数据同步进去
                for (var key in state) {
                    result[key] = state[key];
                }
            }
            return result;
        };
    };
}
exports.connect = connect;
function action(clazz, act) {
    var _a;
    if (clazz.__actions) {
        clazz.__actions[act] = clazz[act];
    }
    else {
        clazz.__actions = (_a = {}, _a[act] = clazz[act], _a);
    }
    clazz[act] = function (payload) {
        _store.dispatch({ type: this.ns + "/" + act, payload: payload });
    };
    return clazz[act];
}
exports.action = action;
exports.default = (function (store, asyncReducers) {
    if (asyncReducers === void 0) { asyncReducers = {}; }
    _store = store;
    _asyncReducers = asyncReducers;
});
//# sourceMappingURL=index.js.map