import {useFunctionQueue} from "./utils/useFunctionQueue.js";
import {dataTypeJudge} from "./utils/dataTypeJudge.js";
import {createProxyObject} from "./utils/createProxyObject.js";

export class NextPage {
    static platform = null

    constructor(platform) {
        NextPage.platform = platform
    }
    /**
     * 创建具有刷新和无限滚动功能的分页处理程序。
     * @param {number} pageNum - 当前页码.
     * @param {number} pageSizeNum - 分页大小.
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
    useNextPage(pageNum = 1, pageSizeNum = 10,) {

        let page = pageNum
        let pageSize = pageSizeNum

        let isNoData = false

        let isByReload = false


        const {setFun, addFun, invokeAllFn} = useFunctionQueue()
        const pageInfo = {
            page: page,
            pageSize: pageSize,
        };
        const pageInfoProxy = createProxyObject(pageInfo)


        function resetPageInfo() {
            pageInfoProxy.page = page
            pageInfoProxy.pageSize = pageSize
        }

        resetPageInfo()


        // 重新加载
        function reloadHandler(callback) {
            isByReload = true
            isNoData = false
            resetPageInfo()
            invokeAllFn();
            if (typeof callback === 'function') {
                callback()
            }
        }

        // 触底加载下一页数据
        function reachBottomHandler() {
            if (pageInfoProxy.page > 1 && !isNoData) {
                invokeAllFn();
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

            if (dataTypeJudge(data, 'array')) {
                if (!dataTypeJudge(resData, 'array')) {
                    console.warn('没有数据要返回空数组！！！')
                    resData = []
                }
                // 修复重新加载时，之前的数据没有清除的bug
                if (isByReload) {
                    data = []
                    isNextPage = true
                    isByReload = false
                }


                if (isNextPage) {
                    pageInfoProxy.page += 1;
                    return data.concat(resData);
                } else {
                    // 只有一页数据
                    if (pageInfoProxy.page === 1) {
                        return resData
                    } else {
                        // 这是最后的一页了1
                        if (!isNoData) {
                            // console.log('这是最后的一页了----1')
                            isNoData = true
                            return data.concat(resData);
                        } else {
                            // console.log('这是最后的一页了----2')
                            return data
                        }
                    }

                }
            } else {
                return resData
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
            mixinReachBottomPullDownRefresh: handleScrollAndRefresh,
            reachBottomHandler,
            pageInfoProxy,
            setFun,
            addFun,
            invokeAllFn,
            reload: reloadHandler,
            dataHandler: resDataHandler,

        }
    }
}
