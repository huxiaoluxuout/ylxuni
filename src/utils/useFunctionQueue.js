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
        addFn: addUniqueFunction,
        setFn: replaceMainFunction,
        invokeAllFn: invokeAllFunctions,
    };
}
