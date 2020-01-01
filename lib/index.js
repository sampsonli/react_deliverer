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
var react_1 = require("react");
// declare const module;
var _store;
var _asyncReducers = {};
function injectReducer(key, reducer) {
    if (_store) {
        /* if (_asyncReducers[key] && !module.hot) {
            console.error('模块命名重复，可能会引发未知错误');
        } */
        _asyncReducers[key] = reducer;
        _store.replaceReducer(redux_1.combineReducers(__assign({}, _asyncReducers)));
    }
    else {
        throw new Error('deliverer 未初始化, 请先调用 deliverer(store)');
    }
}
function deliver(ns) {
    if (ns === void 0) { ns = ''; }
    return function (Clazz) {
        var map = {};
        var mapReverse = {};
        Clazz.prototype.ns = ns;
        // const map = Object.getOwnPropertyNames()
        function doUpdate(newState, oldState) {
            var diff = Object.keys(newState).some(function (key) { return newState[key] !== oldState[key]; });
            if (diff) {
                var _newState_1 = {};
                Object.keys(newState).forEach(function (key) {
                    _newState_1[mapReverse[key]] = newState[key];
                });
                _store.dispatch({ type: Clazz.prototype.ns + "/update", payload: _newState_1 });
            }
        }
        Object.getOwnPropertyNames(Clazz.prototype).forEach(function (key) {
            if (key !== 'constructor' && typeof Clazz.prototype[key] === 'function') {
                var origin_1 = Clazz.prototype[key];
                Clazz.prototype[key] = function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    var rootState = _store.getState();
                    var state = rootState[Clazz.prototype.ns];
                    var _this = Object.create(Clazz.prototype);
                    var _state = {};
                    Object.keys(state).forEach(function (_key) {
                        _this[map[_key]] = state[_key];
                        _state[map[_key]] = state[_key];
                    });
                    if (origin_1.prototype.toString() === '[object Generator]') {
                        var runGen_1 = function (ge, val) {
                            var tmp = ge.next(val);
                            doUpdate(_this, _state);
                            _state = __assign({}, _this);
                            if (tmp.done) {
                                return tmp.value;
                            }
                            if (tmp.value.then) {
                                return tmp.value.then(function (data) { return runGen_1(ge, data); }).catch(function (e) { return ge.throw(e); });
                            }
                            runGen_1(ge, tmp.value);
                        };
                        return runGen_1(origin_1.bind(_this).apply(void 0, args), null);
                    }
                    var result = origin_1.bind(_this).apply(void 0, args);
                    doUpdate(_this, _state);
                    return result;
                };
            }
        });
        Clazz.prototype.useData = function () {
            if (react_1.useState && react_1.useEffect) {
                var _a = react_1.useState(), data = _a[0], setData_1 = _a[1];
                react_1.useEffect(function () {
                    return _store.subscribe(function () {
                        var rootState = _store.getState();
                        setData_1(rootState[Clazz.prototype.ns]);
                    });
                }, []);
                if (!data) {
                    var rootState = _store.getState();
                    return rootState[Clazz.prototype.ns];
                }
                return data;
            }
            else {
                throw new Error('Your react version is too lower, please upgrade newest version!');
            }
        };
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var result = new (Clazz.bind.apply(Clazz, __spreadArrays([void 0], args)))();
            // 容许在外面更改ns
            ns = result.ns || ns;
            Clazz.prototype.ns = ns;
            delete result.ns;
            var initState = {};
            Object.getOwnPropertyNames(result).forEach(function (key) {
                var prop = key.split(/_\d+_/).reverse()[0];
                map[prop] = key;
                mapReverse[key] = prop;
                initState[prop] = result[key];
            });
            var reducer = function (state, _a) {
                if (state === void 0) { state = initState; }
                var type = _a.type, payload = _a.payload;
                if (type === ns + "/update") {
                    return payload;
                }
                return state;
            };
            injectReducer(ns, reducer);
            return result;
        };
    };
}
exports.deliver = deliver;
exports.default = (function (store, asyncReducers) {
    if (asyncReducers === void 0) { asyncReducers = {}; }
    _store = store;
    _asyncReducers = asyncReducers;
});
//# sourceMappingURL=index.js.map