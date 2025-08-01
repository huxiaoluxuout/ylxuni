import {useFunctionQueue} from "./utils/useFunctionQueue.js";
import {dataTypeJudge} from "./utils/dataTypeJudge.js";
import {setWxData} from "./utils/tools.js";
import {createProxyObject} from "./utils/createProxyObject.js";

export class NextPage {
    static platform = null
    static pageInfo = {page: 1, pageSize: 10}
    static loadingObj = {loading: true}
    static dataCallback = () => {
    }

    constructor(platform, reactive) {
        /**
         *  @type {{ stopPullDownRefresh: function(): void }}
         * */
        NextPage.platform = platform
        // vue3 将数据变成响应式
        if (reactive) {
            NextPage.loadingObj = reactive(NextPage.loadingObj)
        }
        this.loadingProxyObject = createProxyObject(NextPage.loadingObj)

    }

    /**
     * 创建具有刷新和无限滚动功能的分页处理程序
     * @param {{pageSize: number, page: number}} pageInfo
     * @param {number} pageInfo.page  -当前页码
     * @param {number}  pageInfo.pageSize- 分页大小
     * @param {object} [wxThis] - 原生微信的 this
     * @param {string} [loadingKey = loading] - loadingKey
     * @returns {{ylxInvokeFn: invokeAllFunctions, ylxReachBottom: reachBottomHandler, ylxSetFn: replaceMainFunction, ylxAddFn: addUniqueFunction, ylxSetData: ((function({data?: Array, resData?: Array}=, number=): (Array))|*), ylxPageInfo: Object, ylxRefresh: reload, ylxSetInv: ylxSetInv, ylxMixins: {onReachBottom(): void, onLoad(): void, onPullDownRefresh(): void}}}
     */
    useNextPage(pageInfo = {page: 1, pageSize: 10}, wxThis, loadingKey = 'loading') {
        const that = this
        const {setFn, addFn, invokeAllFn} = useFunctionQueue()
        const ylxAddFn = addFn
        const ylxSetFn = setFn
        const ylxInvokeFn = invokeAllFn

        if (!dataTypeJudge(pageInfo, 'object')) {
            pageInfo = {page: 1, pageSize: 10}
        }
        if (!pageInfo.page && !pageInfo.pageSize) {
            pageInfo = {page: 1, pageSize: 10}
        }

        let isByReload = false

        let isLastPage = false
        let loadMore = true


        NextPage.pageInfo = {...pageInfo}

        const pageInfoProxy = createProxyObject(pageInfo)


        // 重置page
        function resetPageInfo() {
            pageInfoProxy.page = NextPage.pageInfo.page
            pageInfoProxy.pageSize = NextPage.pageInfo.pageSize
        }

        /**
         * 重新加载
         * @param {function} [callback]
         */
        function reload(callback) {
            isByReload = true
            isLastPage = false
            loadMore = true
            that.loadingProxyObject.loading = true
            setWxData(wxThis, loadingKey, true)

            resetPageInfo()
            ylxInvokeFn();
            if (dataTypeJudge(callback, 'function')) {
                callback(pageInfoProxy)
            }
        }

        // 触底加载下一页数据
        function reachBottomHandler() {
            if (pageInfoProxy.page > 1 && loadMore) {
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

        /**
         * @typedef {Object} ResData
         * @property {Array} rows - 响应数据的数组
         * @property {number} total - 总条数
         */
        /**
         * 处理数据的函数
         * @param {Object} params - 包含数据的对象
         * @param {Array} [params.data=[]] - 数据数组，默认为空数组
         * @param {Array} [params.resData=params.data] - 响应数据，默认为与 data 相同的数组
         * @param {number} total - 总条数
         */
        function resDataHandler({data = [], resData = []} = {}, total = 0) {
            NextPage.platform.stopPullDownRefresh();
            clearTimeout(timeId);
            that.loadingProxyObject.loading = false
            setWxData(wxThis, loadingKey, false)

            if (!dataTypeJudge(data, 'array')) {
                NextPage.dataCallback()
                return resData
            }

            // 列表返回数据要为数组
            if (dataTypeJudge(data, 'array') && !dataTypeJudge(resData, 'array')) {
                resData = []
            }

            // 修复重新加载时，之前的数据没有清除的bug
            if (isByReload) {
                data.length = 0
                isByReload = false
            }

            let len1 = data.length
            let len2 = resData.length
            let isNextPage = total > (len1 + len2)


            // 只有1页数据
            if (pageInfoProxy.page === 1) {
                if (isNextPage) {
                    pageInfoProxy.page += 1;
                }
                NextPage.dataCallback()
                return resData
            } else {

                if (isNextPage) {
                    pageInfoProxy.page += 1;
                    NextPage.dataCallback()
                    return data.concat(resData);

                } else {
                    // 第1次加载最后的一页
                    if (!isLastPage) {
                        // console.log('第1次加载最后的一页')
                        isLastPage = true
                        NextPage.dataCallback()
                        return data.concat(resData);
                    } else {
                        // 第2次加载最后的一页
                        // console.log('第2次加载最后的一页')
                        loadMore = false
                        let startIndex = (pageInfoProxy.page - 1) * pageInfoProxy.pageSize
                        let dataLen = data.length
                        let delNum = dataLen - startIndex
                        // console.log({startIndex, dataLen, delNum})
                        data.splice(startIndex, delNum, ...resData)
                        NextPage.dataCallback()
                        return data
                    }
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

        /**
         * 立即调用
         * @param {function} fn
         */

        function ylxSetInv(fn) {
            ylxSetFn(fn)
            ylxInvokeFn()
        }

        function dataCallback(fn) {
            if (typeof fn === 'function') {
                NextPage.dataCallback = fn
            }
        }


        return {
            ylxMixins: ylxMixins,
            ylxPageInfo: pageInfoProxy,
            ylxReachBottom: reachBottomHandler,
            ylxSetFn: ylxSetFn,
            ylxAddFn: ylxAddFn,
            ylxInvokeFn: ylxInvokeFn,
            ylxRefresh: reload,
            ylxSetData: resDataHandler,
            ylxSetInv: ylxSetInv,
            ylxSetDataCallback: dataCallback,
        }
    }
}
