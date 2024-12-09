import {useFunctionQueue} from "./utils/useFunctionQueue.js";
import {dataTypeJudge} from "./utils/dataTypeJudge.js";
import {createProxyObject} from "./utils/createProxyObject.js";

export class NextPage {
    static platform = null
    static pageInfo = {page: 1, pageSize: 10}

    constructor(platform) {
        NextPage.platform = platform
    }

    /**
     * 创建具有刷新和无限滚动功能的分页处理程序
     * @param {object} pageInfo
     * @param {number} pageInfo.page  -当前页码
     * @param {number}  pageInfo.pageSize- 分页大小
     * @returns {{
     *   dataHandler: ((function({data?: [], resData?: []}, boolean=): (*[]))|*),
     *   reload: function(): void,
     *   handleScrollAndRefresh: {
     *     onReachBottom(): void,
     *     onLoad(): void,
     *     onPullDownRefresh(): void,
     *   },
     *   invokeAllFunctions: function(): void,
     *   pageInfoProxy: Object,
     *   reachBottomHandler: function(): void,
     *   addFunction: function(fn: Function): void,
     *   setFunction: function(fn: Function): void
     * }}
     */
    useNextPage(pageInfo = {page: 1, pageSize: 10}) {
        const {setFun, addFun, invokeAllFn} = useFunctionQueue()
        const ylxAddFun = addFun
        const ylxSetFun = setFun
        const ylxInvokeFn = invokeAllFn

        if (!dataTypeJudge(pageInfo, 'object')) {
            pageInfo = {page: 1, pageSize: 10}
        }
        if (!pageInfo.page && !pageInfo.pageSize) {
            pageInfo = {page: 1, pageSize: 10}
        }
        let isByReload = false

        let hasLastPage = false

        NextPage.pageInfo = {...pageInfo}

        const pageInfoProxy = createProxyObject(pageInfo)

        // 重置page
        function resetPageInfo() {
            pageInfoProxy.page = NextPage.pageInfo.page
            pageInfoProxy.pageSize = NextPage.pageInfo.pageSize
        }

        // 重新加载
        function reloadHandler(callback) {
            console.log('重新加载')
            isByReload = true
            hasLastPage = false
            resetPageInfo()
            ylxInvokeFn();
            if (dataTypeJudge(callback, 'function')) {
                callback()
            }
        }

        // 触底加载下一页数据
        function reachBottomHandler() {
            if (pageInfoProxy.page > 1 && !hasLastPage) {
                ylxInvokeFn();
            }
        }

        let timeId = 0

        // 下拉刷新
        function pullDownRefreshHandler() {
            reloadHandler()
            timeId = setTimeout(() => {
                NextPage.platform.stopPullDownRefresh();
            }, 2500)
        }


        function resDataHandler({data = [], resData = []}, isNextPage = false) {
            NextPage.platform.stopPullDownRefresh();
            clearTimeout(timeId)

            if (!dataTypeJudge(data, 'array')) {
                return resData
            }

            if (dataTypeJudge(data, 'array') && !dataTypeJudge(resData, 'array')) {
                console.warn('列表数据要为空数组！！！')
                resData = []
            }

            // 修复重新加载时，之前的数据没有清除的bug
            if (isByReload) {
                data = []
                isByReload = false
            }

            // 只有一页数据
            if (pageInfoProxy.page === 1) {
                return resData
            }

            if (isNextPage) {
                pageInfoProxy.page += 1;
                return data.concat(resData);

            } else {
                // 第1次加载最后的一页
                if (!hasLastPage) {
                    hasLastPage = true
                    return data.concat(resData);
                } else {
                    // 第2次加载最后的一页
                    let allLen = (pageInfoProxy.page - 1) * pageInfoProxy.pageSize
                    let len = resData.length

                    return data.splice(allLen, len, ...resData)
                }
            }
        }

        const handleScrollAndRefresh = {
            onLoad() {
                resetPageInfo()
            },
            onReachBottom() {
                reachBottomHandler()
            },
            onPullDownRefresh() {
                pullDownRefreshHandler()
            },
        }


        return {
            ylxMixins: handleScrollAndRefresh,
            ylxPageInfo: pageInfoProxy,
            ylxReachBottom: reachBottomHandler,
            ylxSetFun:ylxSetFun,
            ylxAddFun:ylxAddFun,
            ylxInvokeFn:ylxInvokeFn,
            ylxRefresh: reloadHandler,
            ylxSetData: resDataHandler
        }
    }
}
