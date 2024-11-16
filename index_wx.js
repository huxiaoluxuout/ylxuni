import {UseEventBus} from "./src/UseEventBus.js";
import {NextPage} from "./src/NextPage.js";
import {MustLogIn} from "./src/useMustLogIn.js";


function initModule(platform=uni,vue3Reactive) {
    return {
        ylxEventBus: new UseEventBus(platform),
        ylxNextPage: new NextPage(platform),
        ylxMustLogIn: new MustLogIn(platform,vue3Reactive),

    };
}

export default initModule;



