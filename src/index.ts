import {combineReducers} from 'redux';
import {useState, useEffect} from 'react';

let _store;
let _asyncReducers = {};

function injectReducer(key, reducer) {
    if (_store) {
        _asyncReducers[key] = reducer;
        _store.replaceReducer(combineReducers({
            ..._asyncReducers,
        }));
    } else {
        throw new Error('deliverer is not initialized, please invoke "deliverer(store)" before');
    }
}

export function deliver(namespace: string|Function): Function {
    const Target =  function (Clazz) {
        return function (...args) { // constructor
            const instance = new Clazz(...args);
            if(args && typeof args[0] === 'string') {
                instance.ns = instance.ns || args[0];
            }
            const ns = instance.ns || namespace;
            if(!ns) {
                throw new Error("please define 'ns' before")
            }
            delete instance.ns;
            const map = {};
            const mapReverse = {};

            function doUpdate(newState, oldState) {
                const diff = Object.keys(newState).some(key => newState[key] !== oldState[key]);
                if (diff) {
                    const _newState = {};
                    Object.keys(newState).forEach(key => {
                        if(!mapReverse[key]) { // add new props
                            mapReverse[key] = key;
                            map[key] = key
                        }
                        _newState[mapReverse[key]] = newState[key];
                    });
                    _store.dispatch({type: `deliver/${ns}`, payload: _newState});
                }
            }

            const prototype = Object.create(instance);
            prototype.ns = ns;
            const _prototype = Object.create(instance);
            _prototype.ns = ns;
            Object.getOwnPropertyNames(Clazz.prototype).forEach(key => {
                if (key !== 'constructor' && typeof Clazz.prototype[key] === 'function') {
                    const origin = Clazz.prototype[key];
                    prototype[key] = function (...params) {
                        const _this = Object.create(_prototype);
                        if (origin.prototype.toString() === '[object Generator]') {
                            const runGen = (ge, val) => {
                                const state = _store.getState()[ns];
                                const _state = {};
                                Object.keys(state).forEach(function (_key) {
                                    _this[map[_key]] = state[_key];
                                    _state[map[_key]] = state[_key];
                                });
                                const tmp = ge.next(val);
                                doUpdate(_this, _state);
                                if (tmp.done) {
                                    return tmp.value;
                                }
                                if (tmp.value && tmp.value.then) {
                                    return tmp.value.then(data => {
                                        return runGen(ge, data)
                                    }).catch(e => ge.throw(e));
                                }
                                return runGen(ge, tmp.value);
                            };
                            return runGen(origin.bind(_this)(...params), null);
                        }
                        const state = _store.getState()[ns];
                        let _state = {};
                        Object.keys(state).forEach(_key => {
                            _this[map[_key]] = state[_key];
                            _state[map[_key]] = state[_key];
                        });
                        const result = origin.bind(_this)(...params);
                        if(result && typeof result.then === 'function') {
                            doUpdate(_this, _state);
                            _state = {..._this};
                            return result.then(data => {
                                doUpdate(_this, _state);
                                return data;
                            })
                        }
                        doUpdate(_this, _state);
                        return result;
                    };
                    if (origin.prototype.toString() === '[object Generator]') {
                        _prototype[key] = prototype[key]
                    } else {
                        _prototype[key] = Clazz.prototype[key];
                    }
                }
            });
            prototype.useData = function (prop = null) {
                if (useState && useEffect) {
                    const [data, setData] = useState('__UNINITED__');
                    useEffect(() => {
                        return _store.subscribe(() => {
                            const rootState = _store.getState();
                            if(!prop || !rootState[ns]) {
                                return setData(rootState[ns])
                            }
                            if(typeof prop === 'function') {
                                return setData(prop(rootState[ns]))
                            }
                            if(typeof prop === 'string'){
                                return setData(rootState[ns][prop])
                            }
                            setData(rootState[ns])
                        });
                    }, []);
                    if (data === '__UNINITED__') {
                        const rootState = _store.getState();
                        if(!prop || !rootState[ns]) {
                            return rootState[ns]
                        }
                        if(typeof prop === 'function') {
                            return prop(rootState[ns])
                        }
                        if(typeof prop === 'string'){
                            return rootState[ns][prop]
                        }
                        return rootState[ns]
                    }
                    return data
                } else {
                    throw new Error('Your react version is too lower, please upgrade your react!')
                }
            };


            const initState = {};
            Object.getOwnPropertyNames(instance).forEach(key => {
                const prop = key.split(/_\d+_/).reverse()[0]; // convert private property
                map[prop] = key;
                mapReverse[key] = prop;
                initState[prop] = instance[key];
            });
            prototype.reset = function () {
                _store.dispatch({type: `deliver/${ns}`, payload: initState});
            };
            const reducer = (state = initState, {type, payload}) => {
                if (type === `deliver/${ns}`) {
                    return payload;
                }
                return state;
            };
            injectReducer(ns, reducer);
            return Object.create(prototype);
        };
    };
    if(typeof namespace === "function") {
        return Target(namespace)
    }
    return Target
}


export default (store, asyncReducers = {}) => {
    _store = store;
    _asyncReducers = asyncReducers;
};
