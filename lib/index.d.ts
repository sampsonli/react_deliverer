export declare function deliver(namespace: string | Function): Function;
/**
 * 通过hook方式获取模块中数据
 * @param ns 模块名称
 */
export declare const useData: (ns: string) => any;
declare const _default: (store: any, asyncReducers?: {}) => void;
export default _default;
