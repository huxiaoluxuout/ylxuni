export class EventBusCore {
    constructor() {
        this.listeners = new Map();
    }

    on(event, listener) {
        if (typeof listener !== 'function') {
            throw new Error(listener + '必须是一个函数');
        }
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(listener);
    }

    /**
     * @param {string} event  是必填属性
     * @param {function} listener  是必填属性
     */

    once(event, listener) {
        if (typeof listener !== 'function') {
            throw new Error(listener + '必须是一个函数');
        }
        const onceWrapper = (...args) => {
            listener(...args);
            this.off(event, onceWrapper);
        };
        this.on(event, onceWrapper);
    }

    /**
     * 处理不同类型的 options 和任意数量的 args
     * @param {Object|string} options - 可以是对象或字符串
     * @param {string} options.event - 当 options 是对象时，event 是必填属性
     * @param {string} options.source - 当 options 是对象时，source 是必填属性
     * @param {string} [options.handler] - 当 options 是对象时，handler 是可选属性
     * @param {...any} args - 任意数量的参数
     */


    emit(options, ...args) {
        let event, handler, source;
        if (typeof options === 'string') {
            event = options;
        } else if (typeof options === 'object') {
            event = options.event;
            handler = options.handler;
            source = options.source;
        } else {
            throw new Error('Options必须是字符串或对象');
        }

        const listeners = this.listeners.get(event);
        if (!listeners) return;
        if (!handler) {
            listeners.forEach(listener => listener({args, source: source}));
        } else {
            const fn = [...listeners].find(l => l.name === handler);
            if (fn) {
                fn({args, source: source});
            }
        }
    }

    /**
     * @param {string} event
     * @param {function} [listener]
     */

    off(event, listener) {
        if (!listener) {
            this.listeners.set(event, new Set());
        } else if (typeof listener === 'function') {
            const listeners = this.listeners.get(event);
            if (listeners) {
                listeners.delete(listener);
            }
        }
    }

    clear() {
        this.listeners.clear();
    }
}



