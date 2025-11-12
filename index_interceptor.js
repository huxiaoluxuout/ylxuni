
import {InterceptorFn} from "./src/useInterceptor.js";

function InterceptorCall(platform=uni,vue3Reactive) {
    return {
        ylxMustLogIn: new InterceptorFn(platform,vue3Reactive)
    };
}

export default InterceptorCall;



