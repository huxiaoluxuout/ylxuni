import {useInterceptorProxy} from "./utils/useInterceptorProxy.js";
import {dataTypeJudge} from "./utils/dataTypeJudge.js";
import { setWxData} from "./utils/tools.js";
import {createProxyObject} from "./utils/createProxyObject.js";

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
     * 拦截器函数，用于处理目标对象的成功和错误回调。
     * @param {Object} [options={}] - 选项对象
     * @param {Function} [options.success] - 成功回调函数，默认值为一个空函数
     * @param {Function} [options.fail] - 错误回调函数，默认值为一个空函数
     * @returns {Function} - 创建的拦截器函数
     */
    intercept({success = () => {}, fail = () => {}}={}) {
        const {createInterceptor} = useInterceptorProxy(MustLogIn.loginObject)

        return createInterceptor({
            onSuccess: success,
            onError: fail
        })
    }
}

