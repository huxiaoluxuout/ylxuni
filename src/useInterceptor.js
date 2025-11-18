import {useInterceptorProxy} from "./utils/useInterceptorProxy.js";
import {createProxyObject} from "./utils/createProxyObject.js";
import {dataTypeJudge} from "./utils/dataTypeJudge.js";

export class InterceptorFn {
    static platform = null
    static interceptObject = {}
    static vue3Reactive = null

    constructor(platform, reactive) {
        InterceptorFn.platform = platform
        InterceptorFn.vue3Reactive = reactive
        this.initIntercepts({login: false})
    }

    /**
     * @param {object} interceptKeys - 拦截的key
     */
    initIntercepts(interceptKeys) {
        let interceptObject = {}
        // vue3 将数据变成响应式
        if (InterceptorFn.vue3Reactive) {
            interceptObject = InterceptorFn.vue3Reactive(interceptKeys)
        }
        InterceptorFn.interceptObject = createProxyObject(interceptObject)
    }
    static tool(key){
        return !dataTypeJudge(InterceptorFn.interceptObject[key], 'undefined')
    }

    /**
     * @param {string} key - 拦截的key
     * @param {boolean} state - 拦截的key 的状态
     */
    setIntercept(key, state) {
        if (InterceptorFn.tool(key)) {
            InterceptorFn.interceptObject[key] = state
        } else {
            console.error(key + '未定义')
        }
    }

    /**
     * @param {string} key - 拦截的key
     * @returns {boolean} - 拦截的key 的状态
     */
    getInterceptState(key) {
        return InterceptorFn.tool(key) ? InterceptorFn.interceptObject[key] : key + '-1'
    }


    /**
     * 获取所有拦截对象
     * @returns {Object}
     */
    get getIntercepts() {
        return InterceptorFn.interceptObject
    }

    /**
     * 拦截器函数，用于处理目标对象的成功和错误回调。
     * @param {Object} [options={}] - 选项对象
     * @param {Function} [options.success] - 成功回调函数，默认值为一个空函数
     * @param {Function} [options.fail] - 错误回调函数，默认值为一个空函数
     * @param {String} [interceptKey] - 默认 login
     * @returns {Function} - 创建的拦截器函数
     */
    intercept({success = () => {}, fail = () => {}} = {}, interceptKey) {
        if (!InterceptorFn.tool(interceptKey)) {
            console.error(interceptKey + '未定义')
            return
        }
        const {createInterceptor} = useInterceptorProxy(InterceptorFn.interceptObject)
        return createInterceptor({
            onSuccess: success,
            onError: fail
        }, interceptKey || 'login')
    }
}

