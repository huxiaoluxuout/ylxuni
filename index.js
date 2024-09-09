// import {UseEventBus} from "./src/UseEventBus.js";
// import {NextPage} from "./src/NextPage.js";
// import {MustLogIn} from "./src/useMustLogIn.js";

/*import {
    chooseImage,
    uniMakePhoneCall ,
    chooseLocation,
    getLocation,
    openLocation,
    uniBlueTooth,
} from "./src/authorize/UniApi.js";*/





/*function initModule(platform=uni) {
    return {
        // ylxEventBus: new UseEventBus(platform),
        // ylxMustLogIn: new MustLogIn(platform),
        // ylxNextPage: new NextPage(platform),


        // ylxChooseImage: chooseImage,
        // ylxChooseLocation:chooseLocation,
        // ylxMakePhoneCall:uniMakePhoneCall,
        // ylxGetLocation:getLocation,
        // ylxOpenLocation:openLocation,


        // ylxBluetoothManager: new BluetoothManager(platform),

    };
}*/

// export default initModule;

import {YlxBluetoothManager} from "./src/bluetooth/bluetoothManage.js";

export default YlxBluetoothManager;

