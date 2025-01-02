import {dataTypeJudge} from "./dataTypeJudge.js";

/**
 * 解析 URL 路径
 * @param {string} pathUrl 路径 URL
 * @return {Object} 解析后的对象，包含路径、查询参数和分隔符
 */
export function parseUrl(pathUrl) {
    const url = pathUrl.startsWith('/') ? pathUrl : '/' + pathUrl;
    const [path, query] = url.split('?');
    return {
        path,
        query: query ? '?' + query : '',
        delimiter: query ? '&' : '?',
    };
}


/**
 * 创建一个代理对象，用于拦截属性的访问和设置操作
 * @param {Object} targetObject - 需要代理的目标对象
 * @throws {TypeError} - 如果目标对象不是一个对象或为 null
 * @returns {Object} - 返回一个代理对象
 */
export function createProxyObject(targetObject,) {

    // 定义 Proxy 处理器
    const proxyHandler = {
        get(target, property, receiver) {
            return Reflect.get(target, property, receiver);
        },

        set(target, property, value, receiver) {

            return Reflect.set(target, property, value, receiver);
        },
    };

    return new Proxy(targetObject, proxyHandler);
}

/**
 * 设置原生微信小程序
 * @param {object} wxThis
 * @param {string} dataKey
 * @param status
 */

/**
 *  @type {{ setData: function(): void }}
 * */
export function setWxData(wxThis, dataKey, status) {
    if (dataTypeJudge(wxThis, 'object')) {
        if (dataTypeJudge(wxThis.setData, 'function')) {
            wxThis.setData({
                [dataKey]: status
            })
        }
    }
}
/**
 * 将回调式异步函数转换为 Promise 风格的异步函数
 *
 * @param {Function} fn - 传统回调式异步函数，该函数接收一个对象并调用 `success`, `fail`, `complete` 回调。
 * @param {Object} [options={}] - 传递给 `fn` 的选项对象，具体内容根据 `fn` 的实现而定。
 * @param {Function} [completeCallback] - 完成后的回调函数，无论操作成功或失败都会调用它。该回调接收一个参数 `res`，表示操作的最终结果或状态。
 * @returns {Promise} 返回一个 `Promise` 对象，在异步操作成功时会调用 `resolve(res)`，失败时会调用 `reject(err)`。
 *
 */
export function promisify(fn, options = {}, completeCallback) {
    return new Promise((resolve, reject) => {
        fn({
            options,
            success(res) {
                resolve(res);
            },
            fail(err) {
                reject(err);
            },
            complete(res) {
                if (typeof completeCallback === 'function') {
                    completeCallback(res);
                }
            }
        });

    });
}