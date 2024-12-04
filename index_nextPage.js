import {NextPage} from "./src/NextPage.js";


function initNextPage(platform=uni) {
    return {
        ylxNextPage: new NextPage(platform)
    };
}

export default initNextPage;



