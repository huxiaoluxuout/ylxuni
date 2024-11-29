/*
import { dataTypeJudge } from "./utils/dataTypeJudge.js";

export class EventBusCore1 {
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

    on(eventName, listenerFunction) {
        this._validateEventName(eventName);
        this._validateListenerFunction(listenerFunction);

        if (!this.eventListeners.has(eventName)) {
            this.eventListeners.set(eventName, {});
        }

        // 使用 listenerFunction 的字符串表示作为键
        this.eventListeners.get(eventName)[listenerFunction.name] = listenerFunction;
    }

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
            console.warn(`没有找到事件: ${eventName}`);
            return;
        }

        const eventData = { args, source: eventSource };

        if (!handlerName) {
            // 使用 Object.values 遍历 listener 对象，调用所有监听器
            Object.values(listeners).forEach(listener => listener(eventData));
        } else {
            const listener = listeners[handlerName];
            if (listener) {
                listener(eventData);
            } else {
                console.warn(`未找到处理函数: ${handlerName} 在事件: ${eventName}`);
            }
        }
    }

    off(eventName, listenerFunction) {
        this._validateEventName(eventName);

        if (!listenerFunction) {
            this.eventListeners.delete(eventName);
        } else if (dataTypeJudge(listenerFunction, 'function')) {
            const listeners = this.eventListeners.get(eventName);
            if (listeners) {
                delete listeners[listenerFunction.name];  // 直接通过函数名删除
            } else {
                console.warn(`无法移除监听器，事件: ${eventName} 不存在`);
            }
        } else {
            throw new Error(`listenerFunction 必须是一个函数, 当前类型: ${typeof listenerFunction}`);
        }
    }

    clear() {
        this.eventListeners.clear();
    }
}
*/
