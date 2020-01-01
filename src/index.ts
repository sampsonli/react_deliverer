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

export function deliver(ns: string|Function): Function {
    const Target =  function (Clazz) {
        const map = {};
        const mapReverse = {};
        Clazz.prototype.ns = ns;

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
                _store.dispatch({type: `${Clazz.prototype.ns}/update`, payload: _newState});
            }
        }

        Object.getOwnPropertyNames(Clazz.prototype).forEach(key => {
            if (key !== 'constructor' && typeof Clazz.prototype[key] === 'function') {
                const origin = Clazz.prototype[key];
                Clazz.prototype[key] = function (...args) {
                    const rootState = _store.getState();
                    const state = rootState[Clazz.prototype.ns];
                    const _this = Object.create(Clazz.prototype);
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
                        return runGen(origin.bind(_this)(...args), null);
                    }
                    const result = origin.bind(_this)(...args);
                    doUpdate(_this, _state);
                    return result;
                };
            }
        });

        Clazz.prototype.useData = function () {
            if (useState && useEffect) {
                const [data, setData] = useState();
                useEffect(() => {
                    return _store.subscribe(() => {
                        const rootState = _store.getState();
                        setData(rootState[Clazz.prototype.ns])
                    });
                }, []);
                if (!data) {
                    const rootState = _store.getState();
                    return rootState[Clazz.prototype.ns]
                }
                return data
            } else {
                throw new Error('Your react version is too lower, please upgrade newest version!')
            }
        };


        return function (...args) { // constructor
            const result = new Clazz(...args);
            // allow modify ns in instance
            ns = result.ns || ns;
            if(!ns) {
                throw new Error("please define 'ns' before")
            }
            Clazz.prototype.ns = ns;
            delete result.ns;

            const initState = {};
            Object.getOwnPropertyNames(result).forEach(key => {
                const prop = key.split(/_\d+_/).reverse()[0]; // convert private property
                map[prop] = key;
                mapReverse[key] = prop;
                initState[prop] = result[key];
            });
            const reducer = (state = initState, {type, payload}) => {
                if (type === `${ns}/update`) {
                    return payload;
                }
                return state;
            };
            injectReducer(ns, reducer);
            return result;
        };
    };
    if(typeof ns === "function") {
        const Clazz = ns;
        ns = '';
        return Target(Clazz)
    }
    return Target
}


export default (store, asyncReducers = {}) => {
    _store = store;
    _asyncReducers = asyncReducers;
};
