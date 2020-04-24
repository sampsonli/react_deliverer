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
var _store;
var _asyncReducers = {};
function injectReducer(key, reducer) {
    if (_store) {
        _asyncReducers[key] = reducer;
        _store.replaceReducer(redux_1.combineReducers(__assign({}, _asyncReducers)));
    }
    else {
        throw new Error('deliverer is not initialized, please invoke "deliverer(store)" before');
    }
}
function deliver(namespace) {
    var Target = function (Clazz) {
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var instance = new (Clazz.bind.apply(Clazz, __spreadArrays([void 0], args)))();
            if (args && typeof args[0] === 'string') {
                instance.ns = instance.ns || args[0];
            }
            var ns = instance.ns || namespace;
            if (!ns) {
                throw new Error("please define 'ns' before");
            }
            delete instance.ns;
            var map = {};
            var mapReverse = {};
            function doUpdate(newState, oldState) {
                var diff = Object.keys(newState).some(function (key) { return newState[key] !== oldState[key]; });
                if (diff) {
                    var _newState_1 = {};
                    Object.keys(newState).forEach(function (key) {
                        if (!mapReverse[key]) { // add new props
                            mapReverse[key] = key;
                            map[key] = key;
                        }
                        _newState_1[mapReverse[key]] = newState[key];
                    });
                    _store.dispatch({ type: "deliver/" + ns, payload: _newState_1 });
                }
            }
            var prototype = Object.create(instance);
            prototype.ns = ns;
            var _prototype = Object.create(instance);
            _prototype.ns = ns;
            Object.getOwnPropertyNames(Clazz.prototype).forEach(function (key) {
                if (key !== 'constructor' && typeof Clazz.prototype[key] === 'function') {
                    var origin_1 = Clazz.prototype[key];
                    prototype[key] = function () {
                        var params = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            params[_i] = arguments[_i];
                        }
                        var _this = Object.create(_prototype);
                        if (origin_1.prototype.toString() === '[object Generator]') {
                            var runGen_1 = function (ge, val, isError, e) {
                                var state = _store.getState()[ns];
                                var _state = {};
                                Object.keys(state).forEach(function (_key) {
                                    _this[map[_key]] = state[_key];
                                    _state[map[_key]] = state[_key];
                                });
                                var tmp;
                                try {
                                    if (isError) {
                                        tmp = ge.throw(e);
                                    }
                                    else {
                                        tmp = ge.next(val);
                                    }
                                }
                                catch (e) {
                                    doUpdate(_this, _state);
                                    ge.throw(e);
                                    // throw e;
                                }
                                doUpdate(_this, _state);
                                if (tmp.done) {
                                    return tmp.value;
                                }
                                if (tmp.value && tmp.value.then) {
                                    return tmp.value.then(function (data) {
                                        return runGen_1(ge, data, false, null);
                                    }).catch(function (e) {
                                        return runGen_1(ge, null, true, e);
                                    });
                                }
                                return runGen_1(ge, tmp.value, false, null);
                            };
                            return Promise.resolve().then(function () { return runGen_1(origin_1.bind(_this).apply(void 0, params), null, false, null); });
                        }
                        var state = _store.getState()[ns];
                        var _state = {};
                        Object.keys(state).forEach(function (_key) {
                            _this[map[_key]] = state[_key];
                            _state[map[_key]] = state[_key];
                        });
                        var result = origin_1.bind(_this).apply(void 0, params);
                        if (result && typeof result.then === 'function') {
                            doUpdate(_this, _state);
                            _state = __assign({}, _this);
                            return result.then(function (data) {
                                doUpdate(_this, _state);
                                return data;
                            });
                        }
                        doUpdate(_this, _state);
                        return result;
                    };
                    if (origin_1.prototype.toString() === '[object Generator]') {
                        _prototype[key] = prototype[key];
                    }
                    else {
                        _prototype[key] = Clazz.prototype[key];
                    }
                }
            });
            prototype.setData = function (props) {
                var state = _store.getState()[ns];
                var keys = Object.keys(props);
                if (keys.some(function (key) { return props[key] !== state[key]; })) {
                    keys.forEach(function (key) {
                        if (!mapReverse[key]) { // add new props
                            mapReverse[key] = key;
                            map[key] = key;
                        }
                    });
                    var _state = __assign(__assign({}, state), props);
                    _store.dispatch({ type: "deliver/" + ns, payload: _state });
                }
            };
            prototype.useData = function (prop) {
                if (prop === void 0) { prop = null; }
                if (react_1.useState && react_1.useEffect) {
                    var _a = react_1.useState('__UNINITED__'), data = _a[0], setData_1 = _a[1];
                    react_1.useEffect(function () {
                        return _store.subscribe(function () {
                            var rootState = _store.getState();
                            if (!prop || !rootState[ns]) {
                                return setData_1(rootState[ns]);
                            }
                            if (typeof prop === 'function') {
                                return setData_1(prop(rootState[ns]));
                            }
                            if (typeof prop === 'string') {
                                return setData_1(rootState[ns][prop]);
                            }
                            setData_1(rootState[ns]);
                        });
                    }, []);
                    if (data === '__UNINITED__') {
                        var rootState = _store.getState();
                        if (!prop || !rootState[ns]) {
                            return rootState[ns];
                        }
                        if (typeof prop === 'function') {
                            return prop(rootState[ns]);
                        }
                        if (typeof prop === 'string') {
                            return rootState[ns][prop];
                        }
                        return rootState[ns];
                    }
                    return data;
                }
                else {
                    throw new Error('Your react version is too lower, please upgrade your react!');
                }
            };
            var initState = {};
            Object.getOwnPropertyNames(instance).forEach(function (key) {
                var prop = key.split(/_\d+_/).reverse()[0]; // convert private property
                map[prop] = key;
                mapReverse[key] = prop;
                initState[prop] = instance[key];
            });
            prototype.reset = function () {
                _store.dispatch({ type: "deliver/" + ns, payload: initState });
            };
            var reducer = function (state, _a) {
                if (state === void 0) { state = initState; }
                var type = _a.type, payload = _a.payload;
                if (type === "deliver/" + ns) {
                    return payload;
                }
                return state;
            };
            injectReducer(ns, reducer);
            return Object.create(prototype);
        };
    };
    if (typeof namespace === "function") {
        return Target(namespace);
    }
    return Target;
}
exports.deliver = deliver;
exports.default = (function (store, asyncReducers) {
    if (asyncReducers === void 0) { asyncReducers = {}; }
    _store = store;
    _asyncReducers = asyncReducers;
});
//# sourceMappingURL=index.js.map