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
