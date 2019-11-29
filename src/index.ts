import {combineReducers} from 'redux';

declare const module;
let _store = undefined;
let _asyncReducers = {};

function injectReducer(key, reducer) {
    if (_store) {
        if (_asyncReducers[key] && !module.hot) {
            console.error('模块命名重复，可能会引发未知错误');
        }
        _asyncReducers[key] = reducer;
        _store.replaceReducer(combineReducers({
            ..._asyncReducers,
        }));
    } else {
        throw new Error('deliverer 未初始化, 请先调用 deliverer(store)')
    }
}


export function connect<N>(ns: N): Function {
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
                    const modify = mutations[type].bind(curr)(payload, curr) || curr;
                    const diff = Object.keys(modify).some(key => modify[key] !== state[key]);
                    if(diff) {
                        state = modify;
                        for (let key in state) {
                            result[key] = state[key];
                        }
                    }
                }
                return state;
            };
            injectReducer(ns, reducer);
            const rootState = _store.getState();
            const state = rootState[ns];
            if (state) { // 老数据同步进去
                for (let key in state) {
                    result[key] = state[key];
                }
            }
            return result;
        }

    }


}

export function action(clazz, act) {
    if (clazz.__actions) {
        clazz.__actions[act] = clazz[act]
    } else {
        clazz.__actions = {[act]: clazz[act]}
    }
    clazz[act] = function (payload) {
        _store.dispatch({type: this.ns + "/" + act, payload: payload});
    };
    return clazz[act]
}

export default (store, asyncReducers = {}) => {
    _store = store
    _asyncReducers = asyncReducers
};
