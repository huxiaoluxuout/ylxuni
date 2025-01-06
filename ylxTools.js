import {ProxyObject} from "./src/ProxyObject.js";

function initModule(options,platform=uni,vue3Reactive) {
    return {
        ylxProxyObject: new ProxyObject(options,platform,vue3Reactive),
    };
}

export default initModule;



