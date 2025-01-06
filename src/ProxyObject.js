import {createProxyObject} from "./utils/tools.js";
import {dataTypeJudge} from "./utils/dataTypeJudge.js";

export class ProxyObject {
    static platform = null
    static proxyOptions = {}
     reactive = null
    /**
     *
     * @param {object} platform
     * @param {function} reactive
     */
    constructor(platform, reactive) {
        ProxyObject.platform = platform
        if (reactive) {
            this.reactive = reactive
        }
    }

    setObjectProxy(options) {
        if (dataTypeJudge(options, 'object')) {

            // vue3 将数据变成响应式
            if (this.reactive) {
                this.proxyOptions = this.reactive(options)
            }

           return createProxyObject(this.proxyOptions)
        }
    }

}

