/**
 * 使用队列执行函数的钩子
 * @returns {Object} 包含管理队列的函数
 */
export function useFunctionQueue() {
    let mainQueue = [];
    let additionalQueue = [];

    /**
     * 依次调用所有函数
     */
    const invokeAllFunctions = function () {
        const allHandlers = additionalQueue.concat(mainQueue);
        while (allHandlers.length > 0) {
            const {func, args} = allHandlers.pop();
            func(...args);
        }
    };

    /**
     * 设置新的主队列函数（替换现有函数）
     * @param {Function} func - 要设置的函数
     * @param {...*} args - 传递给函数的参数
     */
    const replaceMainFunction = (func, ...args) => {
        mainQueue = [{func, args}];
    };

    /**
     * 添加新的额外队列函数（检查重复性）
     * @param {Function} func - 要添加的函数
     * @param {...*} args - 传递给函数的参数
     */
    const addUniqueFunction = (func, ...args) => {
        const isDuplicate = additionalQueue.some(item => item.func === func && item.args.length === args.length);
        if (!isDuplicate) {
            additionalQueue.push({func, args});
        }
    };

    return {
        addFun: addUniqueFunction,
        setFun: replaceMainFunction,
        invokeAllFn: invokeAllFunctions,
    };
}

/**
 * 判断数据类型
 * @param val
 * @param type
 * @returns {boolean|string}
 */
export function dataTypeJudge(val, type) {
    const dataType = Object.prototype.toString.call(val).replace(/\[object (\w+)\]/, "$1").toLowerCase();
    return type ? dataType === type : dataType;
}


/**
 * 创建一个代理对象，用于拦截属性的访问和设置操作
 * @param {Object} targetObject - 需要代理的目标对象
 * @returns {Object} - 代理对象
 * @throws {TypeError} - 如果目标对象不是一个对象或为 null
 */
export function createProxyObject(targetObject) {
    // 检查参数是否为对象
    if (typeof targetObject !== 'object' || targetObject === null) {
        throw new TypeError('Target must be an object');
    }

    // 定义 Proxy 处理器
    const proxyHandler = {
        get(target, property, receiver) {
            // 可以在这里添加其他逻辑，例如日志记录
            return Reflect.get(target, property, receiver);
        },

        set(target, property, value, receiver) {
            // 可以在这里添加其他逻辑，例如日志记录
            return Reflect.set(target, property, value, receiver);
        },
    };

    return new Proxy(targetObject, proxyHandler);
}


/**
 * 创建一个代理对象的拦截器工具
 * @param {Object} targetObject - 需要代理的目标对象
 * @returns {Object} - 包含代理对象和拦截器函数的对象
 */
export function useInterceptorProxy(targetObject) {
    const proxyObject = createProxyObject(targetObject);

    /**
     * 拦截器函数，用于处理成功和错误的回调
     * @param {Object} callbacks - 包含 `onError` 和 `onSuccess` 回调的对象
     * @param {Function} callbacks.onError - 错误回调函数
     * @param {Function} callbacks.onSuccess - 成功回调函数
     * @returns {Function} - 包装后的拦截器函数
     */
    const createInterceptor = function ({onError, onSuccess}) {
        if (typeof onError !== 'function') {
            console.error(`${onError}: 必须是函数`);
            return;
        }
        if (typeof onSuccess !== 'function') {
            console.error(`${onSuccess}: 必须是函数`);
            return;
        }

        return function (...args) {
            const firstProperty = Object.keys(targetObject)[0];
            if (proxyObject[firstProperty]) {
                onSuccess(...args);
            } else {
                onError();
            }
        };
    };

    return {
        proxyObject,
        createInterceptor,
    };
}

