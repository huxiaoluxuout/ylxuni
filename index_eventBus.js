import {UseEventBus} from "./src/UseEventBus.js";


function initEventBus(platform=uni) {
    return {
        ylxEventBus: new UseEventBus(platform),
    };
}

export default initEventBus;



