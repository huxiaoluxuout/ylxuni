
/**
 * 创建一个代理对象，用于拦截属性的访问和设置操作
 * @param {Object} targetObject - 需要代理的目标对象
 * @param {Object} context 当前上下文
 * @param {string} [context.__wxExparserNodeId__] - 微信小程序原生属性
 * @param {function} [context.setData] - 微信小程序原生触发视图更新
 * @throws {TypeError} - 如果目标对象不是一个对象或为 null
 */

export function createProxyObject(targetObject,context={}) {
    // 检查参数是否为对象
    if (typeof targetObject !== 'object' || targetObject === null) {
        throw new TypeError('Target must be an object');
    }

    // 定义 Proxy 处理器
    const proxyHandler = {
        get(target, property, receiver) {

            return Reflect.get(target, property, receiver);
        },

        set(target, property, value, receiver) {

            if(context.__wxExparserNodeId__){
                context.setData({ [property]: value });
            }
            return Reflect.set(target, property, value, receiver);
        },
    };

    return new Proxy(targetObject, proxyHandler);
}
