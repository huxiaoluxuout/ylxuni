import {createProxyObject} from "./utils/createProxyObject.js";
import {useInterceptorProxy} from "./utils/useInterceptorProxy.js";
import {dataTypeJudge} from "./utils/dataTypeJudge.js";

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

    static agreeToLogIn() {
        MustLogIn.platform.navigateTo({
            url: '/pages/login/login',
            fail(fail) {
                console.error('platform:fail', fail)
            },
        })
    }

    static onError() {
        MustLogIn.platform.showModal({
            title: '登录后，获取完整功能',
            success: function (res) {
                if (res.confirm) {
                    MustLogIn.agreeToLogIn()
                } else if (res.cancel) {
                    MustLogIn.notAgreeToLogIn()
                }
            }
        })
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
     * @param {Function} options.onLoggedIn - 用户已登录时的回调函数，必传。
     * @param {Object} [options.onNotLoggedIn=MustLogIn.onError] - 用户未登录时的选项，默认为 MustLogIn.onError。
     * @param {Function} [options.cancel] - 用户不同意登录时的回调函数，可选，仅当 unLoggedIn 为 MustLogIn.onError 时可用。
     * @param {Function} [options.confirm] - 用户同意登录时的回调函数，可选，仅当 unLoggedIn 为 MustLogIn.onError 时可用。
     * @returns {(function(...[*]): void)|*} 返回创建的拦截器对象。
     */

    interceptMastLogIn({
                           onLoggedIn = () => {
                           },
                           onNotLoggedIn = MustLogIn.onError,
                           cancel = () => {
                           },
                           confirm = MustLogIn.agreeToLogIn
                       }) {
        const {createInterceptor} = useInterceptorProxy(MustLogIn.loginObject)
        // 同意登录
        MustLogIn.agreeToLogIn = confirm
        // 不同意登录
        MustLogIn.notAgreeToLogIn = cancel
        return createInterceptor({
            onSuccess: onLoggedIn,
            onError: onNotLoggedIn
        })
    }
}


