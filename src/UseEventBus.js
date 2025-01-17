import {EventBusCore} from "./EventBusCore.js";
import {dataTypeJudge} from "./utils/dataTypeJudge.js";
import {parseUrl} from "./utils/tools.js";

const instanceEventBus = new EventBusCore()


export class UseEventBus {
    static platform = null

    constructor(platform) {
        UseEventBus.platform = platform
    }

    static eventBusSet = new Set()


    // 构造函数，初始化默认的全局回调函数
    // {args, source}
    static defaultGlobalCallback = () => ({});

    /**
     * 注册全局事件监听器
     * @param {Function} globalCallback 全局回调函数
     */
    onGlobal(globalCallback = UseEventBus.defaultGlobalCallback) {
        instanceEventBus.on('AppEvent', globalCallback);
        instanceEventBus.on('GLOBAL_PAGES_EVENT', UseEventBus.handlerListener);
    }

    static handlerListener({args, source}) {
        let [{targetPath, options, sourceName}] = args
        const {path} = parseUrl(targetPath);
        UseEventBus.sendTargetPage(path, source, options, sourceName)
    }

    // 向目标页面发送数据
    static sendTargetPage(path, source, options, sourceName) {
        if (!UseEventBus.eventBusSet.has(path)) {
            instanceEventBus.once('CURRENT_PAGE_EVENT' + path, () => {
                UseEventBus.eventBusSet.add(path)
                return instanceEventBus.emit({event: path, source: sourceName || source}, options)
            });
        } else {
            instanceEventBus.emit({event: path, source: sourceName || source}, options);
        }
    }

    /**
     * 发送页面事件，并根据需要进行导航
     * @param {object} config 配置对象
     * @param {string} [config.targetPath] 目标路径
     * @param {object} [config.options={}] 传递的数据
     * @param {string} [config.source=''] 自定义来源名称
     * @param {boolean} [config.prevPage=false] 开启上一页
     */
    async emit({targetPath, options = {}, source = '', prevPage = false}) {

        const {currentRoute, prevPageRoute} = await UseEventBus.getRoute();
        if (prevPage && prevPageRoute) {
            targetPath = prevPageRoute
        }


        const mergedOptions = dataTypeJudge(options, 'object') ? Object.assign({fromPage: currentRoute}, options) : options;

        return new Promise(resolve => {
            mergedOptions.thenCallback = resolve
            instanceEventBus.emit({event: 'GLOBAL_PAGES_EVENT', source: currentRoute, handler: 'handlerListener'}, {
                targetPath,
                options: mergedOptions,
                sourceName: source
            });
        })
    }

    /**
     * 发送全局事件
     * @param {Object} [options={}] 选项参数
     * @param {String} [source=''] 自定义来源名称
     */
    async emitGlobal(options = {}, source = '') {
        const {currentRoute} = await UseEventBus.getRoute();
        const mergedOptions = dataTypeJudge(options, 'object') ? Object.assign({fromPage: currentRoute}, options) : options;
        return new Promise(resolve => {
            mergedOptions.thenCallback = resolve
            instanceEventBus.emit({event: 'AppEvent', source: source || currentRoute}, mergedOptions);
        });
    }

    /**
     * 获取当前页面路径
     * @return {Promise<object>} 返回当前页面路径的 Promise 对象
     */
    static getRoute() {
        const pages = getCurrentPages();
        let prevPageRoute = null;
        if (pages.length >= 2) {
            prevPageRoute = '/' + pages[pages.length - 2]['route'];
        }

        const currentRoute = '/' + pages[pages.length - 1]['route'];

        return Promise.resolve({currentRoute, prevPageRoute});
    }

    /**
     * 注册页面通知回调
     * @param {Function} callback 回调函数
     */
    on(callback) {
        if (!dataTypeJudge(callback, 'function')) {
            return
        }


        UseEventBus.getRoute().then(({currentRoute}) => {
            if (!UseEventBus.eventBusSet.has(currentRoute)) {
                UseEventBus.eventBusSet.add(currentRoute)
            }
            // 注册事件
            instanceEventBus.on(currentRoute, callback);
            // 触发发送数据到目标页面
            instanceEventBus.emit('CURRENT_PAGE_EVENT' + currentRoute);

        })

    }

    /**
     * 移除指定事件的监听器
     * @param {Function} listenerFunction - 可选的监听器函数
     * @param {Object} [options]
     * @param [options.targetPath=''] - 路由事件名称
     * @param [options.del=false] - 是否删除targetPath事件中的所有监听器函数
     */
    off(listenerFunction, {targetPath, del = false}) {
        if (dataTypeJudge(targetPath, 'undefined')) {
            UseEventBus.getRoute().then(({currentRoute}) => {
                instanceEventBus.off(currentRoute, listenerFunction, del)
            })
        } else {
            instanceEventBus.off(targetPath, listenerFunction, del)
        }
    }

    /**
     * 清除所有事件监听器
     */
    clear() {
        instanceEventBus.clear()
    }


}


