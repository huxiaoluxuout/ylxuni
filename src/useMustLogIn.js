import {createProxyObject} from "./utils/createProxyObject.js";
import {useInterceptorProxy} from "./utils/useInterceptorProxy.js";

import {reactive} from 'vue'

export class MustLogIn {
    static platform = null
    static loginObject = {login: false}

    constructor(platform) {
        MustLogIn.platform = platform

        // vue3 将数据变成响应式
        if (reactive) {
            MustLogIn.loginObject = reactive(MustLogIn.loginObject)
        }
        this.loginProxyObject = createProxyObject(MustLogIn.loginObject)
    }

    static onError() {
        MustLogIn.platform.showModal({
            title: '登录后，获取完整功能',
            success: function (res) {
                if (res.confirm) {
                    console.log('用户点击确定');
                    MustLogIn.agreeToLogIn()
                } else if (res.cancel) {
                    console.log('用户点击取消');
                    MustLogIn.notAgreeToLogIn()
                }
            }
        })
    }

    // 递归设置代理对象
    setWxProxyObject(targetObject, context) {
        let proxyObject = createProxyObject(targetObject, context);
        let loginProxyObject = createProxyObject(proxyObject, context);

        this.loginProxyObject = loginProxyObject

        return this.loginProxyObject;
    }

    setLoginToken({tokenKey, tokenData}, callback) {
        this.loginProxyObject.login = true
        MustLogIn.platform.setStorage({
            key: tokenKey,
            data: tokenData,
            success: function () {
                if (typeof callback === 'function') {
                    callback()
                }
            }
        })
    }

    unSetLoginToken(tokenKey, callback) {
        this.loginProxyObject.login = false
        MustLogIn.platform.removeStorage({
            key: tokenKey,
            success: function () {
                if (typeof callback === 'function') {
                    callback()
                }
            }
        })
    }

    /**
     * 处理用户登录拦截逻辑并返回一个拦截器。
     *
     * @param {Object} options - 登录拦截选项。
     * @param {Function} options.alreadyLoggedIn - 用户已登录时的回调函数，必传。
     * @param {Object} [options.unLoggedIn=MustLogIn.onError] - 用户未登录时的选项，默认为 MustLogIn.onError。
     * @param {Function} [options.notToLogIn] - 用户不同意登录时的回调函数，可选，仅当 unLoggedIn 为 MustLogIn.onError 时可用。
     * @param {Function} [options.toLogIn] - 用户同意登录时的回调函数，可选，仅当 unLoggedIn 为 MustLogIn.onError 时可用。
     * @returns {(function(...[*]): void)|*} 返回创建的拦截器对象。
     */
    interceptMastLogIn({
                           alreadyLoggedIn = () => {},
                           unLoggedIn = MustLogIn.onError,
                           notToLogIn = () => {},
                           toLogIn = () => {}
                       }) {
        const {createInterceptor} = useInterceptorProxy(MustLogIn.loginObject)
        // 同意登录
        MustLogIn.agreeToLogIn = toLogIn
        // 不同意登录
        MustLogIn.notAgreeToLogIn = notToLogIn
        return createInterceptor({
            onSuccess: alreadyLoggedIn,
            onError: unLoggedIn
        })
    }
}


