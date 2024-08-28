import {UseEventBus} from "./src/UseEventBus.js";
import useReachBottom from "./src/useReachBottom.js";
import {MustLogIn} from "./src/useMustLogIn.js";

/*import {
    chooseImage,
    uniMakePhoneCall ,
    chooseLocation,
    getLocation,
    openLocation,
    uniBlueTooth,
} from "./src/authorize/ylxUniApi.js";*/

function initModule() {
    return {
        ylxEventBus: new UseEventBus(),
        ylxMustLogIn: new MustLogIn(),
        ylxNextPage: useReachBottom,
        // ylxChooseImage: chooseImage,
        // ylxChooseLocation:chooseLocation,
        // ylxMakePhoneCall:uniMakePhoneCall,
        // ylxGetLocation:getLocation,
        // ylxOpenLocation:openLocation,
    };
}

export default initModule;

