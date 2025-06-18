import {dataTypeJudge} from "../utils/dataTypeJudge.js";
 function debounce(func, delay) {
    let timer; // 定时器
    return function (...args) {
        // 保持函数上下文
        const context = this;

        // 如果用户再次触发事件，清除之前的定时器
        clearTimeout(timer);

        // 设置新的定时器，延迟执行函数
        timer = setTimeout(() => {
            func.apply(context, args);
        }, delay);
    };
}

let notifyList = {}

function enableCharacteristicIdNotify({deviceId, characteristicId, serviceId}, callback, errCallback, delay = 200) {

    let num = 0
    let maxNum = 10

    if (notifyList?.[deviceId]?.[characteristicId]) {
        // console.log('notify-OK')
        callback('OK');
        return;
    }

    const notifyLoop = () => {
        if (!notifyList[deviceId]) {
            notifyList[deviceId] = {}
        }

        uni.notifyBLECharacteristicValueChange({
            state: true,
            deviceId: deviceId,
            serviceId: serviceId,
            characteristicId: characteristicId,
            success: (res) => {
                // console.log(`成功启用通知：${characteristicId}`, deviceId);
                const notifyDev = notifyList[deviceId]
                if (!notifyDev?.[characteristicId]) {
                    notifyDev[characteristicId] = characteristicId
                }

                if (typeof callback === 'function') {
                    setTimeout(() => {
                        callback(res)
                    }, delay)

                }
            },
            fail: (err) => {
                // console.error(`启用通知失败：`, deviceId, characteristicId, err);
                if ([10004, 10005].includes(err.code)) {
                    num++
                    if (num > maxNum) {
                        // console.error(`启用通知失败-尝试重新启动已超过${maxNum}次`, deviceId, characteristicId);
                        num = 0
                        if (typeof errCallback === 'function') {
                            errCallback(err)
                        }
                    } else {
                        // console.error(`启用通知失败-尝试重新启动Notify${num}次`, deviceId, characteristicId);
                        setTimeout(() => {
                            notifyLoop();
                        }, delay);
                    }
                }
            }
        });
    }

    notifyLoop()
}

let onIOSPromiseFn = {}

export class BleManager {

    /**
     * @param {object} options
     * @param {string} options.serviceId - 服务UUID
     * @param {string}  [options.name='' ]
     * @param {array} [options.advertisServiceUUIDs=[]]
     */
    static advertisServiceUUIDs
    static name
    static serviceId


    constructor({advertisServiceUUIDs = [], name = '', serviceId = ''}) {
        BleManager.advertisServiceUUIDs = advertisServiceUUIDs
        BleManager.name = name
        BleManager.serviceId = serviceId

        // this.throttledFunc = throttle(this.handleWrite)

    }

    isBluetoothEnabled = false // 蓝牙开启
    isManualClose = false // 标记是否通过API主动关闭
    // 关闭蓝牙模块
    closeBle(callback) {
        return new Promise((resolve, reject) => {
            uni.closeBluetoothAdapter({
                success: (res) => {
                    // console.log('关闭蓝牙模块', res)
                    notifyList = {}
                    resolve(res)
                    this.isManualClose = true // 设置标记
                },
                fail: err => {
                    // console.error('closeBluetoothAdapter-err', err)
                    reject(err);
                },
                complete: (complete) => {
                    notifyList = {}

                    if (typeof callback === 'function') {
                        setTimeout(() => {
                            callback(complete)
                        }, 200)
                    }
                    setTimeout(() => {
                        this.isManualClose = false
                    }, 500)
                }
            });
        });
    }

    /**
     * 初始化蓝牙模块
     * @returns {Promise}
     */

    initBle() {
        return new Promise((resolve, reject) => {
            uni.openBluetoothAdapter({
                success: (res) => {
                    resolve(res)
                },
                fail: err => {
                    console.error('initBle', err)
                    reject(err);
                }
            });
        });
    }

    startDeviceSearchTimeout = null

    startDeviceSearch(duration = 2000) {
        return new Promise((resolve, reject) => {
            // 蓝牙设备主 service 的 uuid 列表,通过该参数过滤掉周边不需要处理的其他蓝牙设备
            const advertisServiceUUIDs = BleManager.advertisServiceUUIDs

            const OBJECT = {
                services: advertisServiceUUIDs,
                interval: 10,
                success: (res) => {
                    clearTimeout(this.startDeviceSearchTimeout)
                    this.startDeviceSearchTimeout = setTimeout(() => {
                        resolve(res)
                    }, duration)
                },

                fail(err) {
                    reject(err);
                }
            }
            if (advertisServiceUUIDs.length === 0) {
                delete OBJECT.services
            }
            uni.startBluetoothDevicesDiscovery(OBJECT);
        })

    }

    getBluetoothAdapterState() {
        return new Promise((resolve, reject) => {
            uni.getBluetoothAdapterState({
                success(res) {
                    resolve(res)
                },
                fail(fail) {
                    reject(fail)
                },
            })
        })

    }

    stopBluetoothDevicesDiscovery(callback) {
        return new Promise((resolve, reject) => {
            uni.stopBluetoothDevicesDiscovery({
                success(res) {
                    // console.log('停止搜索')
                    clearTimeout(this.startDeviceSearchTimeout)
                    resolve(res)
                },
                fail(fail) {
                    console.error(fail)
                    reject(fail)
                },
                complete(res) {
                    if (typeof callback === "function") {
                        callback(res)
                    }
                },
            })
        })
    }


    onBluetoothDeviceFound(callback) {
        uni.onBluetoothDeviceFound((res) => {

            let bluetoothDevices = res.devices
            if (BleManager.name) {
                bluetoothDevices = res.devices.filter(item => (item.name === BleManager.name));
            }

            if (typeof callback === 'function' && bluetoothDevices.length > 0) {
                // callback(bluetoothDevices)
                const foundCallback = debounce(callback, 300)
                foundCallback(bluetoothDevices)
            }
        })
    }

    onBLEConnectionStateChange(callback) {
        uni.onBLEConnectionStateChange((res) => {
            if (typeof callback === 'function') {
                const debounceCallback = debounce(callback, 200)
                debounceCallback(res)
            }
        })
    }

    onBluetoothAdapterStateChange(callback) {
        uni.onBluetoothAdapterStateChange((res) => {
            console.log('onBluetoothAdapterStateChange', res)
            if (typeof callback === 'function') {
                callback(res)
                if (res.available === false) {
                    if (this.isManualClose) {
                        // 通过API主动关闭的逻辑
                        // console.log('应用主动关闭蓝牙适配器')
                    } else {
                        // 用户手动关闭手机蓝牙的逻辑
                        // console.log('用户手动关闭了手机蓝牙')
                    }
                } else {
                    // 蓝牙开启逻辑
                    this.isBluetoothEnabled = true
                }
            }
        })

    }


    /**
     * 获取搜索到的蓝牙设备列表
     */
    getBluetoothDevices() {
        return new Promise((resolve, reject) => {
            uni.getBluetoothDevices({
                success: (res) => {
                    // console.warn('获取搜索到的蓝牙设备列表',res)
                    let bluetoothDevices = res.devices
                    // TODO 1-BleManager.name
                    if (BleManager.name) {
                        bluetoothDevices = res.devices.filter(item => (item.name === BleManager.name));
                    }
                    resolve(bluetoothDevices);
                },

                fail(err) {
                    reject(err);
                }
            });
        })

    }


    /**
     *
     * 发现服务UUID
     * @param {string} deviceId
     * @param {function} callback
     */
    getService(deviceId, callback) {
        uni.getBLEDeviceServices({
            deviceId: deviceId,
            success: (res) => {
                console.log('---------------', res)
                if (res.services.length === 0) {
                    this.getService(deviceId, callback)
                } else {
                    uni.getBLEDeviceCharacteristics({
                        deviceId,
                        serviceId: BleManager.serviceId,
                        success: (res) => {
                            console.log('CharacteristicsRes', res.characteristics)
                            this.getServiceCharacteristicsId({
                                deviceId,
                                serviceId: BleManager.serviceId
                            }).then(characteristics => {

                                console.warn('characteristics', characteristics)
                                if (typeof callback === 'function') {
                                    callback()
                                }
                            })
                        }
                    })
                }

            },
            fail(err) {

            }
        });
    }


    // 启用所有支持 Notify 的特征
    enableNotification(deviceId, characteristics, callback, errCallback, delay = 210) {
        let num = 0
        let maxMum = 10
        function loop(index, deviceId) {
            const characteristic = characteristics[index];
            if (characteristic.properties.notify) {
                if (notifyList?.[deviceId]?.[characteristic.uuid]) {
                    if (typeof callback === 'function') {
                        callback('OK');
                    }
                    return;
                }
                if (!notifyList[deviceId]) {
                    notifyList[deviceId] = {}
                }

                uni.notifyBLECharacteristicValueChange({
                    state: true,
                    deviceId: deviceId,
                    serviceId: BleManager.serviceId,
                    characteristicId: characteristic.uuid,
                    success: (res) => {
                        console.log(`成功启用通知：${index} ${characteristic.uuid}`, deviceId);

                        const notifyDev = notifyList[deviceId]
                        if (!notifyDev?.[characteristic.uuid]) {
                            notifyDev[characteristic.uuid] = characteristic.uuid
                        }

                        // 如果索引超出范围，则结束递归
                        if (index >= characteristics.length - 1) {
                            console.warn('启用通知完成-OK', index, deviceId)
                            if (typeof callback === 'function') {
                                callback(res)
                            }

                        } else {
                            num = 0
                            // 调用下一个特征值的通知
                            setTimeout(() => {
                                loop(index + 1, deviceId);
                            }, delay);
                        }

                    },
                    fail: (err) => {
                        console.error(`启用通知失败：`, deviceId, characteristic.uuid, err);
                        if ([10004, 10005].includes(err.code)) {
                            num++
                            if (num > maxMum) {
                                console.error(`启用通知重试次数已达到${maxMum}次`)
                                num = 0
                                if (typeof errCallback === 'function') {
                                    errCallback(err)
                                }
                            } else {
                                // 如果失败，仍然可以选择调用下一个，或者根据需求进行处理
                                setTimeout(() => {
                                    loop(index, deviceId);
                                }, delay);
                            }
                        }
                    }
                });
            } else {
                // 如果当前特征值不需要通知，直接调用下一个
                loop(index + 1, deviceId)
            }
        }

        loop(0, deviceId)
    }

    /**
     * 更新蓝牙设备的服务和特征信息。
     *
     * @param {Object} params - 更新所需的参数对象。
     * @param {string} params.deviceId - 蓝牙设备的唯一标识符。
     * @param {string} params.serviceId - 蓝牙服务的唯一标识符。
     * @returns {Promise<Object>} 返回一个 Promise，解析为连接的蓝牙设备信息。
     *
     */
    getServiceCharacteristicsId({deviceId, serviceId}) {
        return new Promise((resolve, reject) => {
            uni.getBLEDeviceCharacteristics({
                deviceId,
                serviceId,
                success: (res) => {
                    console.warn('BleManager-获取蓝牙设备的特征UUID', res)
                    resolve(res)
                },
                fail(err) {
                    console.error('服务特征信息。', err)
                    reject(err);
                }
            });
        })
    }

    getConnectedBluetoothDevices(servicesId) {
        // console.warn('servicesId', servicesId)
        return new Promise((resolve, reject) => {
            uni.getConnectedBluetoothDevices({
                // services: '646687FB-033F-9393-6CA2-0E9401ADEB32',
                services: servicesId,
                success(resConnectedDevices) {
                    resolve(resConnectedDevices)
                },
                fail(fail) {
                    console.error('getConnectedBluetoothDevices-fail', fail)
                    reject(fail)
                },
            })

        })

    }

    /**
     * 连接指定蓝牙设备
     * @param {string} deviceId - 设备ID
     * @param {function} [callback] - 连接成功回调
     * @param {number}  [duration=1200] - 连接时间 ms
     * @returns {Promise}
     */


    connect(deviceId, callback, duration = 1000) {

        return new Promise((resolve, reject) => {
            // setTimeout(() => {
            uni.createBLEConnection({
                deviceId: deviceId,
                timeout: 5000,
                success: (res) => {
                    if (typeof callback === 'function') {
                        callback(res)
                    }
                    resolve(res)
                },
                fail: err => {

                    console.error('连接失败', err, `deviceId：${deviceId}`)
                    reject(err);
                }
            });
            // }, duration)

        });

    }

    successHandle(resolve, res, deviceId, callback, duration) {
        // (res) => {
        console.log(`connect-deviceId：${deviceId}`)

        setTimeout(() => {
            this.getServiceCharacteristicsId({deviceId: deviceId, serviceId: BleManager.serviceId}).then(res => {
                if (typeof callback === "function") {
                    callback(res)
                }
                resolve(res)
            })
            // this.getServiceUUIDs(deviceId)

            // this.enableNotification(0, CHARACTERISTICSLIST, deviceId, resolve, res)


            // console.time('111-enabler-start')
            /*BleManager.enabler.start(deviceId, BleManager.serviceId)
                .then(results => {
                    console.log('所有特征值订阅处理完成:', results);
                    resolve(res)
                }).catch(err => {
                    console.error('处理失败:', err);
                    reject(res)
                });*/

        }, duration + 200)
        // }, duration )
        // }
    }


    onData = ({hexString, deviceId, characteristicId}) => {
        // console.log('onData', {hexString, deviceId, characteristicId})
        if (plus.os.name == "iOS") {
            let deviceInfo = onIOSPromiseFn[deviceId]
            if (deviceInfo.paramHex === hexString.toUpperCase() && deviceInfo.deviceId === deviceId && deviceInfo.characteristicId === characteristicId) {
                deviceInfo.resolve()
            } else {
                deviceInfo.reject(deviceInfo)
            }
        }

    }
    /**
     * 向蓝牙设备写入指令
     * @param {string} paramHex - 写入参数 (16进制)
     * @param {string} characteristicId - 特征UUID
     * @param {string} serviceId - 主服务UUID
     * @param {string} deviceId - 设备 MAC
     * @param {number} retryCount - 重试次数计数器
     * @returns {Promise}
     */
    paramHex = ''
    characteristicId = ''
    deviceId = ''

    lastTimestamp = new Date().getTime()


    handleWrite({paramHex, deviceId, characteristicId, serviceId}, resolve, reject) {

        enableCharacteristicIdNotify({deviceId, characteristicId, serviceId}, () => {
            let loopCount = 0
            let maxLoopCount = 10

            const loopWrite = () => {
                let timestamp = new Date().getTime()
                let timeOk = timestamp - this.lastTimestamp >= 300
                if (!timeOk && this.paramHex === paramHex && this.characteristicId === characteristicId && this.deviceId === deviceId) {
                    console.warn('拒绝发送')
                    resolve()
                    return
                }

                if (plus.os.name == "iOS") {
                    onIOSPromiseFn[deviceId] = shortenKey(characteristicId)
                    onIOSPromiseFn[deviceId] = {
                        deviceId,
                        characteristicId,
                        paramHex,
                        resolve,
                        reject
                    }
                }
                console.warn('发送命令=====>', {paramHex, characteristicId: shortenKey(characteristicId), deviceId, serviceId,})

                uni.writeBLECharacteristicValue({
                    deviceId,
                    serviceId,
                    characteristicId,
                    value: hexToArrayBuffer(paramHex),
                    success: (res) => {
                        resolve(res)
                    },
                    fail: (fail) => {
                        console.error('写入失败', {paramHex, characteristicId: shortenKey(characteristicId), deviceId}, fail)
                        if (loopCount < maxLoopCount) {
                            loopCount++
                            setTimeout(() => {
                                loopWrite()
                            }, 100)
                        } else {
                            // 如果重试次数达到3次，返回失败
                            console.error(`重试次数已达到${maxLoopCount}次`)
                            reject(fail)
                        }
                    }
                })

            }

            loopWrite()

        }, (err) => {
            console.error('Notify-开启失败', err)
        }, 210)


    }

    write({paramHex, characteristicId, serviceId, deviceId}) {

        return new Promise((resolve, reject) => {
            // this.throttledFunc({paramHex, characteristicId, serviceId, deviceId}, resolve, reject)
            this.handleWrite({paramHex, characteristicId, serviceId, deviceId}, resolve, reject)
        })

    }


    /**
     * 读取蓝牙数据
     * @param {string} characteristicId 读取的特征uuid
     * @param {string} deviceId 读取的特征uuid
     * @param {string} serviceId = '' - serviceId
     * @param {Function} readCallback
     *
     */
    readCallback = {}

    read({deviceId, serviceId, characteristicId}, readCallback) {
        return new Promise((resolve, reject) => {
            uni.readBLECharacteristicValue({
                deviceId,
                serviceId,
                characteristicId,
                success: (res) => {
                    resolve(res)
                    if (typeof readCallback === 'function') {
                        this.readCallback[deviceId] = readCallback
                    }
                },

                fail: (err) => {
                    console.error(`BleManager-读取数据失败:`, deviceId, characteristicId, err);

                    reject(err)
                }
            });
        })

    }


    /**
     * 接收蓝牙设备返回的数据
     * @param {function} onDataCallback -
     *
     */

    onBLECharacteristicValueChange(onDataCallback) {
        uni.onBLECharacteristicValueChange(res => {
            const {deviceId, serviceId, characteristicId, value} = res;
            const hexString = ab2hex(value);
            const foundCallback = debounce(onDataCallback, 50)
            const onDataFoundCallback = debounce(this.onData, 50)

            if (plus.os.name == "iOS") {
                if (shortenKey(characteristicId) === '34') {
                    foundCallback({hexString, deviceId, serviceId, characteristicId})
                } else {
                    onDataFoundCallback({hexString, deviceId, serviceId, characteristicId})
                    setTimeout(() => {
                        foundCallback({hexString, deviceId, serviceId, characteristicId})
                    }, 150)
                }

            } else {
                foundCallback({hexString, deviceId, serviceId, characteristicId})
            }

            if (this.readCallback[deviceId] && typeof this.readCallback[deviceId] === 'function') {
                this.readCallback[deviceId]({hexString, deviceId, serviceId, characteristicId})
            }
        });
    }

    /**
     * 断开与蓝牙设备的连接
     * @param {string} deviceId - 设备ID
     * @returns {Promise}
     */
    disconnect(deviceId) {
        return new Promise((resolve, reject) => {
            if (!deviceId) {
                reject()
                return
            }
            uni.closeBLEConnection({
                deviceId,
                success: (res) => {
                    // console.log('0 断开与蓝牙设备的连接', res)
                    console.log('disconnect-deviceId-notifyList', deviceId, notifyList);
                    resolve(res)
                },
                fail: (err) => {
                    // console.error('1 断开与蓝牙设备的连接', err)

                    reject(err)
                }
            });
        })
    }


    /**
     * 将十六进制字符串转换为十进制数字。
     *
     * @param {string|number} hexString - 要转换的十六进制字符串。
     * @returns {number} - 转换后的十进制数字。
     */
    hexToDec(hexString) {
        if (!dataTypeJudge(hexString, 'number')) {
            hexString = hexString.toString()
        }

        // 处理可能的前缀 '0x'
        if (hexString.startsWith('0x')) {
            hexString = hexString.slice(2);
        }
        return parseInt(hexString, 16);
    }

    /**
     * 将十进制数字转换为十六进制，并支持手动设置返回的字节数。
     *
     * @param {number|string} decimalNumber - 要转换的十进制数字。
     * @param {number} [byteCount=2] - 要返回的字节数，默认为 2。
     * @returns {string} - 转换后的十六进制字符串，补足到指定字节数。
     */
    decToHex(decimalNumber, byteCount = 2) {
        let hexString = decimalNumber.toString(16).toUpperCase();
        let requiredLength = byteCount * 2; // 每个字节需要两个十六进制字符
        hexString = hexString.padStart(requiredLength, '0');
        // 按字节分割
        let result = [];
        for (let i = 0; i < requiredLength; i += 2) {
            result.push(hexString.slice(i, i + 2));
        }
        return result.join('');
    }

    /**
     * 将十六进制字符串分割成指定长度的部分
     * @param {string|number} hexString - 要分割的十六进制字符串。
     * @param {number} partLength - 每部分的字符长度，默认为2,一个字节。
     * @returns {Array<string>} - 分割后的十六进制字符串数组。
     */
    splitHexString(hexString, partLength = 2) {
        if (!dataTypeJudge(hexString, 'string')) {
            hexString = hexString.toString()
        }
        let parts = [];
        for (let i = 0; i < hexString.length; i += partLength) {
            parts.push(hexString.substring(i, i + partLength)); // 使用 substring
        }
        return parts;
    }

    /**
     * 将十六进制字符串转换成 ASCII码
     * @param {string|number} hexString - 要分割的十六进制字符串。
     * @returns {string} - ASCII码
     */
    hexToAscii(hexString) {
        // 检查传入的参数是否为字符串类型
        if (typeof hexString !== 'string') {
            throw new Error('Invalid input. Expected a string.');
        }

        // 检查字符串的长度是否为偶数
        if (hexString.length % 2 !== 0) {
            throw new Error('Invalid input. Expected an even-length string.');
        }

        // 使用正则表达式检查字符串是否只包含有效的十六进制字符
        const hexRegex = /^[0-9A-Fa-f]+$/;
        if (!hexRegex.test(hexString)) {
            throw new Error('Invalid input. Expected a hexadecimal string.');
        }

        // 初始化结果字符串
        let asciiString = '';

        // 遍历16进制字符串，每次处理两个字符
        for (let i = 0; i < hexString.length; i += 2) {
            // 获取一对16进制字符并转换为ASCII码
            const hexChar = hexString.slice(i, i + 2);
            const asciiCode = parseInt(hexChar, 16);

            // 将ASCII码转换为字符并拼接到结果字符串
            asciiString += String.fromCharCode(asciiCode);
        }

        return asciiString;
    }


    parseMacFromAdvData(advertisData) {
        // 假设厂商数据从第2字节开始写入MAC地址
        // const manufacturerData = advertisData.slice(2, 8);
        const hexArr = Array.from(new Uint8Array(advertisData))
            .map(b => b.toString(16).padStart(2, '0'));
        return hexArr.join(':');
    }

    hexToArrayBuffer(instruction) {
        return new Uint8Array(instruction.match(/[\da-f]{2}/gi).map(ii => parseInt(ii, 16))).buffer
    }


}

function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
}

function shortenKey(key) {
    const hashedKey = hashCode(key);
    return hashedKey.toString(36); // 将哈希值转换为36进制字符串
}


// 16进制转成2进制
function hexToArrayBuffer(instruction) {
    return new Uint8Array(instruction.match(/[\da-f]{2}/gi).map(ii => parseInt(ii, 16))).buffer
}

// 2进制转成16进制
function ab2hex(buffer) {
    return Array.from(new Uint8Array(buffer), bit => ('00' + bit.toString(16)).slice(-2)).join('');
}


function formatMACAddress(macAddress) {
    if (!macAddress || typeof macAddress !== 'string') {
        return macAddress;
    }
    return macAddress.match(/.{1,2}/g).join(':').toUpperCase();
}


// 辅助函数
function getUniqueIDFromBuffer(buffer) {
    const bytes = new Uint8Array(buffer);
    return bytes.reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '');
}

function throttle(func) {
    let lastExecTime = 0;
    let timeout = 50;
    let queue = [];
    let timerId = null;

    // 缓存上一次调用的参数
    const argsCache = new Map();

    function executeNext() {
        if (queue.length === 0) {
            timerId = null;
            return;
        }

        const now = Date.now();
        const timeSinceLast = now - lastExecTime;
        const delay = Math.max(timeout - timeSinceLast, 0);

        if (delay === 0) {
            const args = queue.shift();
            const key = JSON.stringify(args);
            argsCache.delete(key); // 清楚已经执行的参数
            func.apply(null, args);
            lastExecTime = now;
            timerId = setTimeout(executeNext, timeout);
        } else {
            timerId = setTimeout(executeNext, delay);
        }
    }

    return function (...args) {
        const now = Date.now();
        const timeSinceLast = now - lastExecTime;
        const key = JSON.stringify(args);


        if (timeSinceLast >= timeout) {

            func.apply(null, args);
            lastExecTime = now;
            if (queue.length > 0 && !timerId) {
                timerId = setTimeout(executeNext, timeout);
            }
            argsCache.set(key, true);
        } else {
            if (argsCache.has(key)) {
                // 如果参数相同，清除队列，重新加入
                queue = queue.filter(item => JSON.stringify(item) !== key);
                console.warn('参数相同', key, queue)
                return
            }
            queue.push(args);
            if (!timerId) {
                const delay = timeout - timeSinceLast;
                timerId = setTimeout(executeNext, delay);
            }
            argsCache.set(key, true);
        }

    };
}

/*
function throttle(func) {
    let lastExecTime = 0;
    let timeout = 2000;
    let queue = [];
    let timerId = null;

    function executeNext() {
        if (queue.length === 0) {
            timerId = null;
            return;
        }
        console.warn('queue',queue.length,queue)

        const now = Date.now();
        const timeSinceLast = now - lastExecTime;
        const delay = Math.max(timeout - timeSinceLast, 0);

        if (delay === 0) {
            const args = queue.shift();
            func.apply(null, args);
            lastExecTime = now;
            timerId = setTimeout(executeNext, timeout);
        } else {
            timerId = setTimeout(executeNext, delay);
        }
    }

    return function (...args) {
        const now = Date.now();
        const timeSinceLast = now - lastExecTime;

        if (timeSinceLast >= timeout) {
            func.apply(null, args);
            lastExecTime = now;
            if (queue.length > 0 && !timerId) {
                timerId = setTimeout(executeNext, timeout);
            }
        } else {
            queue.push(args);
            if (!timerId) {
                const delay = timeout - timeSinceLast;
                timerId = setTimeout(executeNext, delay);
            }
        }
    };
}

*/
