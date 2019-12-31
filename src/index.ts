import {combineReducers} from 'redux';

// declare const module;
let _store;
let _asyncReducers = {};

function injectReducer(key, reducer) {
    if (_store) {
        /* if (_asyncReducers[key] && !module.hot) {
            console.error('模块命名重复，可能会引发未知错误');
        } */
        _asyncReducers[key] = reducer;
        _store.replaceReducer(combineReducers({
            ..._asyncReducers,
        }));
    } else {
        throw new Error('deliverer 未初始化, 请先调用 deliverer(store)');
    }
}


export function deliver(ns: string = ''): Function {
    return function (Clazz) { // 注入 clazz 代表目标类
        const map = {};
        const mapReverse = {};
        Clazz.prototype.ns = ns;
        // const map = Object.getOwnPropertyNames()

        function doUpdate(newState, oldState) {
            const diff = Object.keys(newState).some(key => newState[key] !== oldState[key]);
            if (diff) {
                const _newState = {};
                Object.keys(newState).forEach(key => {
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
                    })
                    if (origin.prototype.toString() === '[object Generator]') {
                        const runGen = (ge, val) => {
                            const tmp = ge.next(val);
                            doUpdate(_this, _state);
                            _state = {..._this};
                            if (tmp.done) {
                                return tmp.value;
                            } if (tmp.value.then) {
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

        Clazz.prototype.useData = () => {
            const rootState = _store.getState();
            return rootState[Clazz.prototype.ns];
        };


        return function (...args) { // 构造函数, 返回新的类
            const result = new Clazz(...args);
            // 容许在外面更改ns
            ns = result.ns || ns;
            Clazz.prototype.ns = ns;
            delete result.ns;

            const initState = {};
            Object.getOwnPropertyNames(result).forEach(key => {
                const prop = key.split('_').reverse()[0];
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
}

export default (store, asyncReducers = {}) => {
    _store = store;
    _asyncReducers = asyncReducers;
};
