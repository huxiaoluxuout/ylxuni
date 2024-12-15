/*import {
    chooseImage,
    uniMakePhoneCall ,
    chooseLocation,
    getLocation,
    openLocation,
    uniBlueTooth,
} from "./src/authorize/UniApi.js";*/




import {UseEventBus} from "./src/UseEventBus.js";
import {NextPage} from "./src/NextPage.js";
import {MustLogIn} from "./src/useMustLogIn.js";

function initModule(platform=uni,vue3Reactive) {
    return {
        ylxEventBus: new UseEventBus(platform),
        ylxNextPage: new NextPage(platform,vue3Reactive),
        ylxMustLogIn: new MustLogIn(platform,vue3Reactive),


        // ylxChooseImage: chooseImage,
        // ylxChooseLocation:chooseLocation,
        // ylxMakePhoneCall:uniMakePhoneCall,
        // ylxGetLocation:getLocation,
        // ylxOpenLocation:openLocation,


    };
}

export default initModule;



