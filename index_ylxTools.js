import {dataTypeJudge} from "./src/utils/dataTypeJudge.js";
import {createProxyObject} from "./src/utils/createProxyObject.js";
import {useInterceptorProxy} from "./src/utils/useInterceptorProxy.js";
import {debounce, parseUrl, promisify, setWxData} from "./src/utils/tools.js";
function initYlxTools() {
    return {
        dataTypeJudge,
        createProxyObject,
        useInterceptorProxy,
        parseUrl,
        setWxData,
        promisify,
        debounce,
    }
}
export default initYlxTools
