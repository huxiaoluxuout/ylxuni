import {MustLogIn} from "./src/useMustLogIn.js";

function mustLogIn(platform=uni,vue3Reactive) {
    return {
        ylxMustLogIn: new MustLogIn(platform,vue3Reactive)
    };
}

export default mustLogIn;



