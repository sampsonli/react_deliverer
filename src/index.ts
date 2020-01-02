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
        throw new Error('deliverer not initialize, please invoke "deliverer(store)"');
    }
}

export function deliver(namespace: string|Function): Function {
    const Target =  function (Clazz) {
        return function (...args) { // constructor
            const instance = new Clazz(...args);
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
                    _store.dispatch({type: `${ns}/update`, payload: _newState});
                }
            }

            const prototype = Object.create(instance);
            prototype.ns = ns;
            Object.getOwnPropertyNames(Clazz.prototype).forEach(key => {
                if (key !== 'constructor' && typeof Clazz.prototype[key] === 'function') {
                    const origin = Clazz.prototype[key];
                    prototype[key] = function (...params) {
                        const rootState = _store.getState();
                        const state = rootState[ns];
                        const _this = Object.create(prototype);
                        let _state = {};
                        Object.keys(state).forEach(_key => {
                            _this[map[_key]] = state[_key];
                            _state[map[_key]] = state[_key];
                        });
                        if (origin.prototype.toString() === '[object Generator]') {
                            const runGen = (ge, val) => {
                                const tmp = ge.next(val);
                                doUpdate(_this, _state);
                                _state = {..._this};
                                if (tmp.done) {
                                    return tmp.value;
                                }
                                if (tmp.value.then) {
                                    return tmp.value.then(data => runGen(ge, data)).catch(e => ge.throw(e));
                                }
                                runGen(ge, tmp.value);
                            };
                            return runGen(origin.bind(_this)(...params), null);
                        }
                        const result = origin.bind(_this)(...params);
                        doUpdate(_this, _state);
                        return result;
                    };
                }
            });
            prototype.useData = function (prop = null) {
                if (useState && useEffect) {
                    const [data, setData] = useState();
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
                                setData(rootState[ns][prop])
                            }
                        });
                    }, []);
                    if (!data) {
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
            const reducer = (state = initState, {type, payload}) => {
                if (type === `${ns}/update`) {
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
