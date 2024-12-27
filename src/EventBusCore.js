import {dataTypeJudge} from "./utils/dataTypeJudge.js";

export class EventBusCore {
    constructor() {
        this.eventListeners = new Map();
    }

    /**
     * 为指定事件添加监听器
     * @param {string} eventName - 事件名称
     * @param {Function} listenerFunction - 监听器函数
     */
    on(eventName, listenerFunction) {

        if (!this.eventListeners.has(eventName)) {
            this.eventListeners.set(eventName, {});
        }
        // 使用 listenerFunction 的字符串表示作为键
        this.eventListeners.get(eventName)[listenerFunction.name] = listenerFunction;
    }

    /**
     * 为指定事件添加一次性监听器
     * @param {string} eventName - 事件名称
     * @param {Function} listenerFunction - 监听器函数
     */
    once(eventName, listenerFunction) {

        const onceWrapper = (...args) => {
            listenerFunction(...args);
            this.off(eventName, onceWrapper);
        };

        // 使用匿名函数的字符串表示作为键来存储
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

        if (dataTypeJudge(options, 'string')) {
            eventName = options;
        } else if (dataTypeJudge(options, 'object')) {
            eventName = options.event;
            handlerName = options.handler;
            eventSource = options.source;
        }

        const listeners = this.eventListeners.get(eventName);
        console.log('listeners', listeners)
        if (!listeners) {
            return;
        }

        const eventData = {args, source: eventSource};

        if (!handlerName) {
            // 使用 Object.values 遍历 listener 对象，调用所有监听器
            Object.values(listeners).forEach(listener => listener(eventData));
        } else {
            const listener = listeners[handlerName];

            if (listener) {
                listener(eventData);
            }
        }
    }

    /**
     * 移除指定事件的监听器
     * @param {string} eventName - 事件名称
     * @param {Function} [listenerFunction] - 可选的监听器函数
     * @param {boolean} [del=false] - eventName中的所有监听器函数
     */
    off(eventName, listenerFunction, del) {

        if (!listenerFunction) {
            this.eventListeners.delete(eventName);
        } else if (dataTypeJudge(listenerFunction, 'function')) {
            const listeners = this.eventListeners.get(eventName);
            if (listeners) {
                if (del) {
                    Object.keys(listeners).forEach(key => {
                        delete listeners[key];
                    });
                } else {
                    delete listeners[listenerFunction.name];  // 直接通过函数名删除

                }
            } else {

            }
        }
    }

    remove(path) {
        return new Promise((resolve, reject) => {
            let isDeleted = this.eventListeners.delete(path)
            if (isDeleted) {
                console.log('删除成功');
                resolve()
            } else {
                reject()
                console.log('删除失败，键不存在');
            }
        })

    }

    /**
     * 清除所有事件监听器
     */
    clear() {
        this.eventListeners.clear();
    }
}
