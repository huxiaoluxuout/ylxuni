/**
 * 创建单例代理处理程序
 * @param {Function} target - 目标构造函数
 * @returns {ProxyHandler} 代理处理程序对象
 */
export function singletonHandler(target) {
    let instance;
    const handler = {
        construct(target, argumentsList) {
            // 如果单例实例已经存在,直接返回该实例
            if (instance) {
                return instance;
            }
            // 否则创建一个新实例并保存
            instance = new target(...argumentsList);

            // 替换代理处理程序为简单函数,优化性能
            handler.construct = () => instance;

            return instance;
        }
    };
    return handler;
}
