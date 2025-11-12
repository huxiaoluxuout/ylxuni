import {useInterceptorProxy} from "./utils/useInterceptorProxy.js";
import {createProxyObject} from "./utils/createProxyObject.js";

export class InterceptorFn {
    static platform = null
    static interceptObject = {}
    static vue3Reactive = null

    constructor(platform, reactive) {
        InterceptorFn.platform = platform
        InterceptorFn.vue3Reactive = reactive
        this.initInterceptKeys({login: false})
    }

    /**
     * @param {object} interceptKeys - 拦截的key
     */
    initInterceptKeys(interceptKeys) {
        InterceptorFn.interceptObject = interceptKeys
        // vue3 将数据变成响应式
        if (InterceptorFn.vue3Reactive) {
            InterceptorFn.interceptObject = InterceptorFn.vue3Reactive(InterceptorFn.interceptObject)
        }
        this.interceptObject = createProxyObject(InterceptorFn.interceptObject)
    }

    /**
     * @param {string} key - 拦截的key
     * @param {boolean} state - 拦截的key 的状态
     */
    setInterceptKey(key, state) {
        if (this.interceptObject[key]) {
            this.interceptObject[key] = state
        } else {
            console.error('未定义的key：' + key)
        }
    }

    /**
     * @param {string} key - 拦截的key
     * @returns {boolean} - 拦截的key 的状态
     */
    getInterceptKey(key) {
        return this.interceptObject[key] ? this.interceptObject[key] : key + ' -1'
    }

    /**
     * 拦截器函数，用于处理目标对象的成功和错误回调。
     * @param {Object} [options={}] - 选项对象
     * @param {Function} [options.success] - 成功回调函数，默认值为一个空函数
     * @param {Function} [options.fail] - 错误回调函数，默认值为一个空函数
     * @param {String} [interceptKey] - 默认 login
     * @returns {Function} - 创建的拦截器函数
     */
    intercept({
                  success = () => {
                  }, fail = () => {
        }
              } = {}, interceptKey) {
        const {createInterceptor} = useInterceptorProxy(InterceptorFn.interceptObject)
        return createInterceptor({
            onSuccess: success,
            onError: fail
        }, interceptKey || 'login')
    }
}

