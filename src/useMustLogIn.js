import {useInterceptorProxy} from "./utils/useInterceptorProxy.js";
import {dataTypeJudge} from "./utils/dataTypeJudge.js";
import {createProxyObject, setWxData} from "./utils/tools.js";

export class MustLogIn {
    static platform = null
    static loginObject = {login: false}

    static wxThis = null
    static wxLoginKey = 'login'

    constructor(platform, reactive) {
        MustLogIn.platform = platform

        // vue3 将数据变成响应式
        if (reactive) {
            MustLogIn.loginObject = reactive(MustLogIn.loginObject)
        }

        this.loginProxyObject = createProxyObject(MustLogIn.loginObject)
    }

    /**
     * @param {object} wxThis - 原生微信的this
     * @param {string} loginKey - loginKey
     */
    wxSetLogin(wxThis, loginKey = 'login') {
        MustLogIn.wxThis = wxThis
        MustLogIn.wxLoginKey = loginKey
    }

    setLoginToken({tokenKey, tokenData}, callback) {
        this.loginProxyObject.login = true
        setWxData(MustLogIn.wxThis,MustLogIn.wxLoginKey,true)

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
        setWxData(MustLogIn.wxThis,MustLogIn.wxLoginKey,false)

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
     * @param {Object} param - 登录拦截选项。
     * @param {function} param.success - 用户已登录时的回调函数，必传。
     * @param {function} param.fail - 用户未登录时的选项
     * @returns {(function(...[*]): void)|*} 返回创建的拦截器对象。
     */

    intercept({success = () => {}, fail = () => {}}={}) {
        const {createInterceptor} = useInterceptorProxy(MustLogIn.loginObject)

        return createInterceptor({
            onSuccess: success,
            onError: fail
        })
    }
}

