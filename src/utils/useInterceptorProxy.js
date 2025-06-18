import {createProxyObject} from "./createProxyObject.js";

/**
 * 创建一个代理对象的拦截器工具
 * @param {Object} targetObject - 需要代理的目标对象
 * @returns {{ proxyObject: Object, createInterceptor: Function }} - 包含代理对象和拦截器函数的对象
 */
export function useInterceptorProxy(targetObject) {
    const proxyObject = createProxyObject(targetObject);

    /**
     * 拦截器函数，用于处理成功和错误的回调
     * @param {Object} callbacks - 包含 `onError` 和 `onSuccess` 回调的对象
     * @param {Function} callbacks.onError - 错误回调函数
     * @param {Function} callbacks.onSuccess - 成功回调函数
     * @returns {Function} - 包装后的拦截器函数
     */
    const createInterceptor = function ({onError, onSuccess}) {

        return function (...args) {
            const firstProperty = Object.keys(targetObject)[0];
            if (proxyObject[firstProperty]) {
                onSuccess(...args);
            } else {
                onError();
            }
        };
    };

    return {
        proxyObject,
        createInterceptor,
    };
}
