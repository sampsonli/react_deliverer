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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
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
function deliver(ns) {
    if (ns === void 0) { ns = ''; }
    return function (clazz) {
        clazz.prototype.ns = ns;
        var actions = clazz.prototype.__actions || {};
        delete clazz.prototype.__actions;
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var result = new (clazz.bind.apply(clazz, __spreadArrays([void 0], args)))();
            var mutations = {};
            // 容许在外面更改ns
            ns = result.ns || ns;
            clazz.prototype.ns = ns;
            delete result.ns;
            Object.keys(actions).forEach(function (func) {
                mutations[ns + "/" + func] = actions[func];
            });
            var reducer = function (state, _a) {
                if (state === void 0) { state = JSON.parse(JSON.stringify(result)); }
                var type = _a.type, payload = _a.payload;
                if (mutations[type]) {
                    var curr_1 = __assign({}, state);
                    mutations[type].bind(curr_1)(payload, curr_1);
                    var diff = Object.keys(curr_1).some(function (key) { return curr_1[key] !== state[key]; });
                    if (diff) {
                        state = curr_1;
                        for (var key in state) {
                            result[key] = state[key];
                        }
                    }
                }
                return state;
            };
            var rootState = _store.getState() || {};
            var state = rootState[ns];
            if (state) { // 老数据同步进去
                for (var key in state) {
                    result[key] = state[key];
                }
            }
            injectReducer(ns, reducer);
            Object.keys(clazz.prototype).forEach(function (key) {
                if (typeof clazz.prototype[key] === "function" && !actions[key]) {
                    var origin_1 = clazz.prototype[key];
                    clazz.prototype[key] = function () {
                        var args = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            args[_i] = arguments[_i];
                        }
                        var rootState = _store.getState();
                        var state = rootState[ns];
                        origin_1.bind(__assign(__assign({}, clazz.prototype), state)).apply(void 0, args);
                    };
                }
            });
            return result;
        };
    };
}
exports.deliver = deliver;
function reducer(clazz, act) {
    var _a;
    if (clazz.__actions) {
        clazz.__actions[act] = clazz[act];
    }
    else {
        clazz.__actions = (_a = {}, _a[act] = clazz[act], _a);
    }
    clazz[act] = function (payload) {
        _store.dispatch({ type: clazz.ns + "/" + act, payload: payload });
    };
    return clazz[act];
}
exports.reducer = reducer;
exports.default = (function (store, asyncReducers) {
    if (asyncReducers === void 0) { asyncReducers = {}; }
    _store = store;
    _asyncReducers = asyncReducers;
});
//# sourceMappingURL=index.js.map