import {createProxyObject, useInterceptorProxy} from "./utils/tools.js";
/*function getMaxDepth(obj) {
    let maxDepth = 0;

    function findDepth(currentObj, currentDepth) {
        // 当前递归深度
        if (typeof currentObj === 'object' && currentObj !== null) {
            maxDepth = Math.max(maxDepth, currentDepth);
            for (let key in currentObj) {
                if (currentObj.hasOwnProperty(key) && typeof currentObj[key] === 'object' && currentObj[key] !== null) {
                    findDepth(currentObj[key], currentDepth + 1);
                }
            }
        }
    }

    findDepth(obj, 1);
    return maxDepth;
}*/

// import {reactive} from 'vue'
let reactive

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
                } else if (res.cancel) {
                    console.log('用户点击取消');
                }
            }
        })
    }

    // 递归设置代理对象
    setWxProxyObject(targetObject, context) {
        let proxyObject = createProxyObject(targetObject, context);
        let loginProxyObject = createProxyObject(proxyObject, context);

        this.loginProxyObject=loginProxyObject

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




