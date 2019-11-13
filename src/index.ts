import {combineReducers} from 'redux';

let _store = undefined;
let _asyncReducers = undefined;

declare const module;

export function connect<N>(ns: N): Function {
    if (_store) {
        const injectReducer = (key, reducer) => {
            _asyncReducers[key] = reducer;
            _store.replaceReducer(combineReducers({
                ..._asyncReducers,
            }));
        };
        if (_asyncReducers[ns] && !module.hot) {
            console.error('模块命名重复，可能会引发未知错误');
        }
        return function (clazz) { // 注入 clazz 代表目标类
            return function () {  // 构造函数, 返回新的类
                const result = new clazz();
                result.ns = ns;
                const actions = clazz.prototype.__actions || {};
                const mutations = {};
                Object.keys(actions).forEach(func => {
                    mutations[`${ns}/${func}`] = actions[func]
                });
                const reducer = (state = JSON.parse(JSON.stringify(result)), {type, payload}) => {
                    if (mutations[type]) {
                        const curr = {...state};
                        state = mutations[type].bind(curr)(payload) || curr;
                        (<any>Object).assign(result, state);
                    }
                    return state;
                };
                injectReducer(ns, reducer);
                const rootState = _store.getState();
                if(rootState[ns]) {
                    (<any>Object).assign(result, rootState[ns])
                }
                return result;


            }

        }
    } else {
        throw new Error('deliverer 未初始化, 请先调用 deliverer(store)')
    }


}

export function action(clazz, act) {
    if(clazz.__actions) {
        clazz.__actions[act] = clazz[act]
    } else {
        clazz.__actions = {[act]: clazz[act]}
    }
    clazz[act] = function (payload) {
        _store.dispatch({ type: this.ns + "/" + act, payload: payload });
    };
    return clazz[act]
}

export default (store, asyncReducers = {}) => {
    _store = store
    _asyncReducers = asyncReducers
};
