import {useInterceptorProxy} from "./utils/useInterceptorProxy.js";
import {dataTypeJudge} from "./utils/dataTypeJudge.js";
import {createProxyObject} from "./utils/tools.js";
export class MustLogIn {
    static platform = null
    static loginObject = {login: false}

    constructor(platform, reactive) {
        MustLogIn.platform = platform

        // vue3 将数据变成响应式
        if (reactive) {
            MustLogIn.loginObject = reactive(MustLogIn.loginObject)
        }

        this.loginProxyObject = createProxyObject(MustLogIn.loginObject)
    }

    setLoginToken({tokenKey, tokenData}, callback) {
        this.loginProxyObject.login = true
        MustLogIn.platform.setStorage({
            key: tokenKey,
            data: tokenData,
            success: function () {
                if (dataTypeJudge(callback, 'function')) {
                    callback()
                }
            }
        })
    }

    /**
     * @param {function} [callback] - 移除token后的回调函数
     * @param {string} tokenKey - 要移除的token
     */
    unSetLoginToken(callback, tokenKey = 'token') {
        this.loginProxyObject.login = false
        MustLogIn.platform.removeStorage({
            key: tokenKey,
            success: function () {
                if (dataTypeJudge(callback, 'function')) {
                    callback()
                }
            }
        })
    }

    /**
     * 处理用户登录拦截逻辑并返回一个拦截器。
     * @param {Object} options - 登录拦截选项。
     * @param {Function} options.success - 用户已登录时的回调函数，必传。
     * @param {Object} [options.fail=MustLogIn.onError] - 用户未登录时的选项，默认为 MustLogIn.onError。
     * @returns {(function(...[*]): void)|*} 返回创建的拦截器对象。
     */

    intercept({
                           success = () => {
                           },
                           fail = () => {
                           },

                       }) {
        const {createInterceptor} = useInterceptorProxy(MustLogIn.loginObject)

        return createInterceptor({
            onSuccess: success,
            onError: fail
        })
    }
}


