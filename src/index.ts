import {combineReducers} from 'redux';
import {useState, useEffect} from 'react';
declare var Promise

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
                const keys = Object.keys(newState);
                const diff = keys.some(key => newState[key] !== oldState[key]);
                if (diff) {
                    const _newState = {};
                    keys.forEach(key => {
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
            let superProps = [];
            if(Object.getPrototypeOf(Clazz) !== Function.prototype) {
                superProps = Object.getOwnPropertyNames(Object.getPrototypeOf(Clazz).prototype)
            }
            [...superProps, ...Object.getOwnPropertyNames(Clazz.prototype)].forEach(key => {
                if (key !== 'constructor' && typeof Clazz.prototype[key] === 'function') {
                    const origin = Clazz.prototype[key];
                    prototype[key] = function (...params) {
                        const _this = Object.create(_prototype);
                        if (origin.prototype.toString() === '[object Generator]') {
                            const runGen = (ge, val, isError, e) => {
                                const state = _store.getState()[ns];
                                const _state = {};
                                Object.keys(state).forEach(function (_key) {
                                    _this[map[_key]] = state[_key];
                                    _state[map[_key]] = state[_key];
                                });
                                let tmp;
                                try {
                                    if(isError) {
                                        tmp = ge.throw(e);
                                    } else {
                                        tmp = ge.next(val);
                                    }
                                } catch (e) {
                                    doUpdate(_this, _state);
                                    ge.throw(e);
                                    // throw e;
                                }
                                doUpdate(_this, _state);
                                if (tmp.done) {
                                    return tmp.value;
                                }
                                if (tmp.value && tmp.value.then) {
                                    return tmp.value.then(data => {
                                        return runGen(ge, data, false, null)
                                    }).catch(e => {
                                        return runGen(ge, null, true, e);
                                    });
                                }
                                return runGen(ge, tmp.value, false, null);
                            };
                            return Promise.resolve().then(() => runGen(origin.bind(_this)(...params), null, false, null));
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

            /**
             * 设置模块数据
             * @param props， 要设置属性的集合， 为普通对象，比如 {a: 1, b:2}, 代表设置模块中a属性为1， b属性为2
             */
            prototype.setData = function(props) {
                const state = _store.getState()[ns];
                const keys = Object.keys(props)
                if(keys.some(key => props[key] !== state[key])){
                    keys.forEach(key => {
                        if(!mapReverse[key]) { // add new props
                            mapReverse[key] = key;
                            map[key] = key
                        }
                    });
                    const _state = {...state, ...props};
                    _store.dispatch({type: `deliver/${ns}`, payload: _state});
                }

            }
            /**
             * react hooks写法获取模块中数据
             * @param prop 可以为 字符串：模块中某个属性，方法：模块属性选择器， 空：整个模块数据
             */
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

            /**
             * 获取model保存在store中的数据
             */
            prototype.getData = function () {
                const rootState = _store.getState();
                return rootState[ns]
            };

            /**
             * 重置模块数据到初始状态， 一般用于组件销毁的时候调用
             */
            prototype.reset = function () {
                _store.dispatch({type: `deliver/${ns}`, payload: initState});
            };


            const initState = {};
            Object.getOwnPropertyNames(instance).forEach(key => {
                const prop = key.split(/_\d+_/).reverse()[0]; // convert private property
                map[prop] = key;
                mapReverse[key] = prop;
                initState[prop] = instance[key];
            });
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
