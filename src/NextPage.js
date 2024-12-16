import {useFunctionQueue} from "./utils/useFunctionQueue.js";
import {dataTypeJudge} from "./utils/dataTypeJudge.js";
import {createProxyObject} from "./utils/tools.js";


export class NextPage {
    static platform = null
    static pageInfo = {page: 1, pageSize: 10}
    static loadingObj = {loading: true}

    loadingProxyObject = null


    constructor(platform, reactive) {
        NextPage.platform = platform
        // vue3 将数据变成响应式
        if (reactive) {
            NextPage.loadingObj = reactive(NextPage.loadingObj)
        }
        this.loadingProxyObject = createProxyObject(NextPage.loadingObj)


    }

    setLoadingProxyObject(b) {
        this.loadingProxyObject.loading = b
    }

    /**
     * 创建具有刷新和无限滚动功能的分页处理程序
     * @param {object} pageInfo
     * @param {number} pageInfo.page  -当前页码
     * @param {number}  pageInfo.pageSize- 分页大小
     * @returns {{
     *   ylxSetData: ((function({data?: [], resData?: []}, boolean): (*[]))|*),
     *   ylxRefresh: function(): void,
     *   ylxMixins: {
     *     onReachBottom(): void,
     *     onLoad(): void,
     *     onPullDownRefresh(): void,
     *   },
     *   ylxAddFn: function(): void,
     *   ylxSetFn: function(fn: Function): void,
     *   ylxInvokeFn: function(fn: Function): void
     *   ylxPageInfo: Object,
     *   ylxReachBottom: function(): void,
     *
     * }}
     */
    useNextPage(pageInfo = {page: 1, pageSize: 10}) {
        const that = this
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
        function reload(callback) {
            isByReload = true
            hasLastPage = false
            that.setLoadingProxyObject(true)
            resetPageInfo()
            ylxInvokeFn();
            if (dataTypeJudge(callback, 'function')) {
                callback(pageInfoProxy)
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
        function pullDownRefresh() {
            reload()
            timeId = setTimeout(() => {
                NextPage.platform.stopPullDownRefresh();
            }, 2500)
        }


        function resDataHandler({data = [], resData = []}, isNextPage = false) {
            NextPage.platform.stopPullDownRefresh();
            clearTimeout(timeId);
            that.setLoadingProxyObject(false)

            if (!dataTypeJudge(data, 'array')) {
                return resData
            }

            // 列表返回数据要为数组
            if (dataTypeJudge(data, 'array') && !dataTypeJudge(resData, 'array')) {
                resData = []
            }

            // 修复重新加载时，之前的数据没有清除的bug
            if (isByReload) {
                data = []
                isByReload = false
            }

            // 只有1页数据
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
                    let eleLen = (pageInfoProxy.page - 1) * pageInfoProxy.pageSize
                    let len = resData.length
                    // TODO 待验证
                    return data.splice(eleLen, len, ...resData)
                }
            }
        }

        const ylxMixins = {
            onLoad() {
                resetPageInfo()
            },
            onReachBottom() {
                reachBottomHandler()
            },
            onPullDownRefresh() {
                pullDownRefresh()
            },
        }


        return {
            ylxMixins: ylxMixins,
            ylxPageInfo: pageInfoProxy,
            ylxReachBottom: reachBottomHandler,
            ylxSetFn: ylxSetFun,
            ylxAddFn: ylxAddFun,
            ylxInvokeFn: ylxInvokeFn,
            ylxRefresh: reload,
            ylxSetData: resDataHandler
        }
    }
}
