import {combineReducers} from 'redux';

// declare const module;
let _store = undefined;
let _asyncReducers = {};

function injectReducer(key, reducer) {
    if (_store) {
        /*if (_asyncReducers[key] && !module.hot) {
            console.error('模块命名重复，可能会引发未知错误');
        }*/
        _asyncReducers[key] = reducer;
        _store.replaceReducer(combineReducers({
            ..._asyncReducers,
        }));
    } else {
        throw new Error('deliverer 未初始化, 请先调用 deliverer(store)')
    }
}


export function deliver(ns:string = ''): Function {
    return function (clazz) { // 注入 clazz 代表目标类
        clazz.prototype.ns = ns;
        const actions = clazz.prototype.__actions || {};
        delete clazz.prototype.__actions;
        return function (...args) {  // 构造函数, 返回新的类
            const result = new clazz(...args);
            const mutations = {};
            // 容许在外面更改ns
            ns = result.ns || ns;
            clazz.prototype.ns = ns;
            delete result.ns;

            Object.keys(actions).forEach(func => {
                mutations[`${ns}/${func}`] = actions[func]
            });
            const reducer = (state = JSON.parse(JSON.stringify(result)), {type, payload}) => {
                if (mutations[type]) {
                    const curr = {...state};
                    mutations[type].bind(curr)(payload, curr);
                    const diff = Object.keys(curr).some(key => curr[key] !== state[key]);
                    if(diff) {
                        state = curr;
                        for (let key in state) {
                            result[key] = state[key];
                        }
                    }
                }
                return state;
            };
            const rootState = _store.getState() || {};
            const state = rootState[ns];
            if (state) { // 老数据同步进去
                for (let key in state) {
                    result[key] = state[key];
                }
            }
            injectReducer(ns, reducer);
            Object.keys(clazz.prototype).forEach(key => {
                if(typeof clazz.prototype[key] === "function" && !actions[key]) {
                    const origin = clazz.prototype[key];
                    clazz.prototype[key] = function (...args) {
                        const rootState = _store.getState();
                        const state = rootState[ns];
                        origin.bind({...clazz.prototype, ...state})(...args);
                    }
                }
            });
            return result;
        }

    }


}

export function reducer(clazz, act) {
    if (clazz.__actions) {
        clazz.__actions[act] = clazz[act]
    } else {
        clazz.__actions = {[act]: clazz[act]}
    }
    clazz[act] = function (payload) {
        _store.dispatch({type: clazz.ns + "/" + act, payload: payload});
    };
    return clazz[act]
}

export default (store, asyncReducers = {}) => {
    _store = store;
    _asyncReducers = asyncReducers
};
