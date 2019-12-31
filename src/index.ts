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


export function deliver(ns: string = ''): Function {
    return function (clazz) { // 注入 clazz 代表目标类
        clazz.prototype.ns = ns;

        function doUpdate(newState, oldState) {
            const diff = Object.keys(newState).some(key => newState[key] !== oldState[key]);
            if (diff) {
                _store.dispatch({type: clazz.prototype.ns + "/update", payload: {...newState}});
            }
        }

        Object.keys(clazz.prototype).forEach(key => {
            if (typeof clazz.prototype[key] === "function") {
                const origin = clazz.prototype[key];
                clazz.prototype[key] = function (...args) {

                    const rootState = _store.getState();
                    let state = rootState[clazz.prototype.ns];
                    const _this = {...state};
                    if (origin.prototype.toString() === '[object Generator]') {
                        const runGen = (ge, val) => {
                            const tmp = ge.next(val);
                            doUpdate(_this, state);
                            state = {..._this};
                            if (tmp.done) {
                                return tmp.value
                            } else if(tmp.value.then) {
                                return tmp.value.then(data => runGen(ge, data)).catch(e => ge.throw(e))
                            } else {
                                runGen(ge, tmp.value)
                            }
                        };
                        return runGen(origin.bind(_this)(...args), null)
                    } else {
                        const result = origin.bind(_this)(...args);
                        doUpdate(_this, state);
                        return result;
                    }


                }
            }
        });

        clazz.prototype.useData = () => {
            const rootState = _store.getState();
            return  rootState[clazz.prototype.ns];
        }


        return function (...args) {  // 构造函数, 返回新的类
            const result = new clazz(...args);
            // 容许在外面更改ns
            ns = result.ns || ns;
            clazz.prototype.ns = ns;
            delete result.ns;

            const reducer = (state = JSON.parse(JSON.stringify(result)), {type, payload}) => {
                if (type === ns + "/update") {
                    return payload
                }
                return state;
            };
            injectReducer(ns, reducer);
            return result;
        }

    }

}

export default (store, asyncReducers = {}) => {
    _store = store;
    _asyncReducers = asyncReducers
};
