import {createProxyObject, useInterceptorProxy} from "./utils/tools.js";


import {reactive} from 'vue'

export class MustLogIn {
    static platform = null
    static loginObject = {login: false}

    constructor() {
        if (uni) {
            MustLogIn.platform = uni
        } else if (wx) {
            MustLogIn.platform = wx
        }
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
                } else if (res.cancel) {
                    console.log('用户点击取消');
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
                if (typeof callback === 'function') {
                    callback()
                }
            }
        })
    }

    updateLogin(callback) {
        this.loginProxyObject.login = true
        if (typeof callback === 'function') {
            callback()
        }
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
     *
     * @param onSuccess
     * @param onError
     * @returns {(function(...[*]): void)|*}
     */
    interceptMastLogIn({onSuccess, onError = MustLogIn.onError}) {
        const {createInterceptor} = useInterceptorProxy(MustLogIn.loginObject)
        return createInterceptor({onSuccess, onError})
    }
}




