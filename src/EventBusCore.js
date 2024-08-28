export class EventBusCore {
    constructor() {
        this.eventListeners = new Map();
    }

    /**
     * 为指定事件添加监听器
     * @param {string} eventName - 事件名称
     * @param {Function} listenerFunction - 监听器函数
     * @throws {Error} 如果 listenerFunction 不是函数则抛出错误
     */
    on(eventName, listenerFunction) {
        if (typeof listenerFunction !== 'function') {
            throw new Error(`${listenerFunction} 必须是一个函数`);
        }
        if (!this.eventListeners.has(eventName)) {
            this.eventListeners.set(eventName, new Set());
        }
        this.eventListeners.get(eventName).add(listenerFunction);
    }

    /**
     * 为指定事件添加一次性监听器
     * @param {string} eventName - 事件名称
     * @param {Function} listenerFunction - 监听器函数
     * @throws {Error} 如果 listenerFunction 不是函数则抛出错误
     */
    once(eventName, listenerFunction) {
        if (typeof listenerFunction !== 'function') {
            throw new Error(`${listenerFunction} 必须是一个函数`);
        }
        const onceWrapper = (...args) => {
            listenerFunction(...args);
            this.off(eventName, onceWrapper);
        };
        this.on(eventName, onceWrapper);
    }

    /**
     * 触发指定事件
     * @param {Object|string} options - 可以是对象或字符串
     * @param {string} options.event - 当 options 是对象时，event 是必填属性
     * @param {string} options.source - 当 options 是对象时，source 是必填属性
     * @param {string} [options.handler] - 当 options 是对象时，handler 是可选属性
     * @param {...any} args - 任意数量的参数
     */
    emit(options, ...args) {
        let eventName, handlerName, eventSource;
        if (typeof options === 'string') {
            eventName = options;
        } else if (typeof options === 'object') {
            eventName = options.event;
            handlerName = options.handler;
            eventSource = options.source;
        } else {
            throw new Error('Options 必须是字符串或对象');
        }

        const listeners = this.eventListeners.get(eventName);
        if (!listeners) return;

        const eventData = { args, source: eventSource };

        if (!handlerName) {
            listeners.forEach(listener => listener(eventData));
        } else {
            for (const listener of listeners) {
                if (listener.name === handlerName) {
                    listener(eventData);
                    break;
                }
            }
        }
    }

    /**
     * 移除指定事件的监听器
     * @param {string} eventName - 事件名称
     * @param {Function} [listenerFunction] - 可选的监听器函数
     */
    off(eventName, listenerFunction) {
        if (!listenerFunction) {
            this.eventListeners.delete(eventName);
        } else if (typeof listenerFunction === 'function') {
            const listeners = this.eventListeners.get(eventName);
            if (listeners) {
                listeners.delete(listenerFunction);
            }
        }
    }

    /**
     * 清除所有事件监听器
     */
    clear() {
        this.eventListeners.clear();
    }
}
