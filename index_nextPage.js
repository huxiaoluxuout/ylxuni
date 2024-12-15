import {NextPage} from "./src/NextPage.js";


function initNextPage(platform=uni,vue3Reactive) {
    return {
        ylxNextPage: new NextPage(platform,vue3Reactive)
    };
}

export default initNextPage;



