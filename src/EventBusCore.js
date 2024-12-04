import {dataTypeJudge} from "./utils/dataTypeJudge.js";

export class EventBusCore {
    constructor() {
        this.eventListeners = new Map();
    }

    _validateEventName(eventName) {
        if (typeof eventName !== 'string') {
            throw new Error(`事件名称必须是一个字符串，当前类型: ${typeof eventName}`);
        }
    }

    _validateListenerFunction(listenerFunction) {
        if (!dataTypeJudge(listenerFunction, 'function')) {
            throw new Error(`listenerFunction 必须是一个函数, 当前类型: ${typeof listenerFunction}`);
        }
    }

    /**
     * 为指定事件添加监听器
     * @param {string} eventName - 事件名称
     * @param {Function} listenerFunction - 监听器函数
     */
    on(eventName, listenerFunction) {
        this._validateEventName(eventName);
        this._validateListenerFunction(listenerFunction);

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
        this._validateEventName(eventName);
        this._validateListenerFunction(listenerFunction);

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
        } else {
            throw new Error('Options 必须是字符串或对象');
        }

        this._validateEventName(eventName);

        const listeners = this.eventListeners.get(eventName);
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
        this._validateEventName(eventName);

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
                console.warn(`无法移除监听器，事件: ${eventName} 不存在`);
            }
        } else {
            throw new Error(`listenerFunction 必须是一个函数, 当前类型: ${typeof listenerFunction}`);
        }
    }

    /**
     * 清除所有事件监听器
     */
    clear() {
        this.eventListeners.clear();
    }
}
