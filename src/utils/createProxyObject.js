/**
 * 创建一个代理对象，用于拦截属性的访问和设置操作
 * @param {Object} Object - 需要代理的普通对象
 * @throws {TypeError} - 如果目标对象不是一个对象或为 null
 * @returns {Object} - 返回一个代理对象
 */
export function createProxyObject(Object,) {
// 检查参数是否为对象
    if (typeof Object !== 'object' || Object === null) {
        throw new TypeError('Target must be an object');
    }
    // 定义 Proxy 处理器
    const proxyHandler = {
        get(target, property, receiver) {
            return Reflect.get(target, property, receiver);
        },

        set(target, property, value, receiver) {

            return Reflect.set(target, property, value, receiver);
        },
    };

    return new Proxy(Object, proxyHandler);
}
