import {dataTypeJudge} from "../utils/dataTypeJudge.js";


let searchTimeout = null
let osName = 'ios'


/**
 * @class BluetoothManager
 * 该类用于管理蓝牙设备的连接、搜索和数据通信。
 */
export class BluetoothManager {
    static connectionTimeout = null

    static connectDevice = {
        connected: false,
        deviceId: '',
        connectServiceInfo: {
            serviceId: '',
            characteristicUUIds: []
        }
    }
    static name = ''

    static searchTime = 3000

    static write = {
        writeCharacteristicId: '',
        callback: function () {
        }
    }
    static red = {
        redCharacteristicId: '',
        callback: function () {
        }
    }

    /**
     * @param {object} options
     * @param {string} options.serviceId - 服务UUID
     * @param {string}  [options.name='' ]
     * @param {array} [options.advertisServiceUUIDs=[]]
     */
    constructor({advertisServiceUUIDs = [], name = '', serviceId = ''}) {
        BluetoothManager.advertisServiceUUIDs = advertisServiceUUIDs
        BluetoothManager.name = name
        BluetoothManager.connectDevice.connectServiceInfo.serviceId = serviceId;
    }

    /**
     * 初始化蓝牙模块
     * @returns {Promise}
     */

    initBle() {
        return new Promise((resolve, reject) => {
            uni.openBluetoothAdapter({
                success() {
                    BluetoothManager.startDeviceSearch(resolve, reject)
                },
                fail: err => {
                    reject(err);
                }
            });
        });
    }

    static startDeviceSearch(resolve, reject) {

        // 蓝牙设备主 service 的 uuid 列表,通过该参数过滤掉周边不需要处理的其他蓝牙设备
        const advertisServiceUUIDs = BluetoothManager.advertisServiceUUIDs
        console.log(`advertisServiceUUIDs:${JSON.stringify(advertisServiceUUIDs)}`)
        const OBJECT = {
            services: advertisServiceUUIDs,
            success() {
                searchTimeout = setTimeout(() => {
                    BluetoothManager.getBluetoothDevices(resolve, reject);
                }, BluetoothManager.searchTime);
            },

            fail(err) {
                reject(err);
            }
        }
        if (advertisServiceUUIDs.length === 0) {
            delete OBJECT.services
        }

        uni.startBluetoothDevicesDiscovery(OBJECT);
    }


    /**
     * 获取搜索到的蓝牙设备列表
     * @param {Function} resolve
     * @param {Function} reject
     */
    static getBluetoothDevices(resolve, reject) {
        uni.getBluetoothDevices({
            success(res) {
                console.log(`原始蓝牙列表数据: ${JSON.stringify(res)}`)
                if (searchTimeout) {
                    clearTimeout(searchTimeout);
                }
                let bluetoothDevices = res.devices

                if (BluetoothManager.name) {
                    bluetoothDevices = res.devices.filter(item => (item.name === BluetoothManager.name));
                }

                resolve(bluetoothDevices);
            },
            fail(err) {
                reject(err);
            },
            complete() {
                /*停止蓝牙设备搜索*/
                uni.stopBluetoothDevicesDiscovery({
                    fail(err) {
                        console.log(`停止蓝牙设备搜索: ${JSON.stringify({err: err})}`)
                    }
                });
            }
        });
    }


    /**
     * 获取蓝牙设备的服务UUID
     * @param {Function} resolve
     * @param {Function} reject
     */

    static getServiceUUIDs(resolve, reject) {
        uni.getBLEDeviceServices({
            deviceId: BluetoothManager.connectDevice.deviceId,
            success(res) {
                if (res.services && res.services.length) {
                    console.log(`services: ${JSON.stringify(res)}`)
                    BluetoothManager.connectDevice.connectServiceInfo.characteristicUUIds = res.services;
                    resolve({ok: true, connectDevice: BluetoothManager.connectDevice})
                    if (BluetoothManager.connectionTimeout) {
                        clearTimeout(BluetoothManager.connectionTimeout);
                    }
                } else {
                    reject({ok: false, connectDevice: BluetoothManager.connectDevice});
                }
            },
            fail(err) {
                reject({ok: false, connectDevice: {}, err: err});
            }
        });
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
    updateServiceId({
                        deviceId = BluetoothManager.connectDevice.deviceId,
                        serviceId = BluetoothManager.connectDevice.connectServiceInfo.serviceId,
                    }) {

        return new Promise((resolve, reject) => {
            BluetoothManager.connectDevice.connectServiceInfo.serviceId = serviceId
            uni.getBLEDeviceCharacteristics({
                deviceId,
                serviceId,
                success(res) {
                    console.log(`获取蓝牙设备的特征UUID:-${JSON.stringify(res)}`,)
                    BluetoothManager.connectDevice.connectServiceInfo.characteristicUUIds = res.characteristics;
                    resolve(BluetoothManager.connectDevice)
                },
                fail(err) {
                    reject(err);
                }
            });
        })
    }

    /**
     * 启动蓝牙通知监听
     * @param {string} serviceId - 服务uuid
     * @param {string} characteristicId - 特征值的 uuid
     * @param {function} successCallback
     * @param {function} failCallback
     */
    static startNotify(serviceId, characteristicId, successCallback, failCallback) {
        const {deviceId} = BluetoothManager.connectDevice;
        uni.notifyBLECharacteristicValueChange({
            state: true,
            deviceId,
            serviceId,
            characteristicId,
            success(res) {
                successCallback(res)
            },
            fail(err) {
                failCallback(err)
            }
        });
    }

    /**
     * 连接指定蓝牙设备
     * @param {string} deviceId - 设备ID
     * @param {number}  [duration=1500] - 连接时间 ms
     * @returns {Promise}
     */
    connect(deviceId, duration = 1500) {
        console.log(`deviceId：${deviceId}`)
        return new Promise((resolve, reject) => {
            uni.createBLEConnection({
                deviceId: deviceId,
                success() {
                    BluetoothManager.connectDevice.deviceId = deviceId
                    BluetoothManager.connectionTimeout = setTimeout(() => {
                        BluetoothManager.getServiceUUIDs(resolve, reject);
                    }, duration);
                },
                fail: err => {
                    reject(err);
                }
            });
        });
    }


    /**
     * 向蓝牙设备写入指令
     * @param {string} instruction - 指令的16进制字符串
     * @param {string} writeCharacteristicId - 特征UUID
     * @returns {Promise}
     */
    write(instruction, writeCharacteristicId) {
        const {deviceId, connectServiceInfo: {serviceId}} = BluetoothManager.connectDevice;
        return new Promise((resolve, reject) => {
            uni.writeBLECharacteristicValue({
                deviceId,
                serviceId,
                characteristicId: writeCharacteristicId,
                value: hexToArrayBuffer(instruction),
                success(res) {
                    BluetoothManager.write.writeCharacteristicId = writeCharacteristicId
                    resolve(res)
                },
                fail(fail) {
                    reject(fail)
                }
            })
        })
    }


    /**
     * 读取蓝牙数据
     * @param {string} redCharacteristicId 读取的特征uuid
     * @param {Function} readCallback
     * @param {Function} [errCallback = ()=>{}]
     * @param {string} [endMarker = ''] - 结束标记
     */
    read(redCharacteristicId, readCallback, errCallback, endMarker = '') {
        if (!BluetoothManager.red.redCharacteristicId) {
            BluetoothManager.onBLECharacteristicValueChange(endMarker);
        }

        const {deviceId, connectServiceInfo: {serviceId}} = BluetoothManager.connectDevice;

        uni.readBLECharacteristicValue({
            deviceId,
            serviceId,
            characteristicId: redCharacteristicId,
            success: () => {
                BluetoothManager.red.redCharacteristicId = redCharacteristicId
                BluetoothManager.red.callback = readCallback
            },
            fail: (err) => {
                console.error(`读取数据失败: ${JSON.stringify(err)}`);
                errCallback(err)
            }
        });
    }

    /**
     * 接收蓝牙设备返回的数据
     * @param {string} [endMarker] - 结束标记
     */
    static onBLECharacteristicValueChange(endMarker = '') {
        let fullData = '';
        uni.onBLECharacteristicValueChange(res => {
            const hexString = ab2hex(res.value);
            console.log(`000-hexString: ${hexString}`)
            fullData += hexString;
            if (fullData.endsWith(endMarker)) {
                if (BluetoothManager.red.redCharacteristicId === res.characteristicId) {
                    BluetoothManager.red.callback(fullData)
                }
                if (BluetoothManager.write.writeCharacteristicId === res.characteristicId) {
                    BluetoothManager.write.callback(fullData)
                }
                fullData = '';
            }
        });
    }

    /**
     * 监听蓝牙连接状态
     */
    onConnectionStateChange(callback) {
        uni.onBLEConnectionStateChange(res => {
            BluetoothManager.connectDevice.connected = res.connected
            callback(res)
        })
    }

    /**
     * 重新搜索附近的蓝牙设备
     * @param {boolean} [remain=ture] - 开启直接自动连接
     * @param {number} [duration=1500] - 连接时间
     * @param {function} [callback] -
     * @param {function} [errCallback] -
     */
    searchAgain(remain = true, duration = 1500, callback, errCallback) {
        return new Promise((resolveAgain, rejectAgain) => {
            function deviceSearch() {
                return new Promise((resolve, reject) => {
                    BluetoothManager.startDeviceSearch(resolve, reject);
                });
            }

            deviceSearch().then((devices) => {
                resolveAgain(devices)
                let {deviceId, connected} = BluetoothManager.connectDevice
                if (remain && !connected) {
                    if (dataTypeJudge(callback, 'function') && dataTypeJudge(errCallback, 'function')) {
                        this.connect(deviceId, duration).then(callback).catch(errCallback)
                    }
                }
            }).catch(rejectAgain)
        });
    }

    /**
     * 断开与蓝牙设备的连接
     * @param {string} deviceId - 设备ID
     * @returns {Promise}
     */
    disconnect(deviceId) {
        return new Promise((resolve, reject) => {
            uni.closeBLEConnection({
                deviceId,
                success: (res) => {
                    resolve(res)
                },
                fail: (err) => {
                    console.error(`读取数据失败: ${JSON.stringify(err)}`);
                    reject(err)
                }
            });
        })
    }

    /**
     * 关闭蓝牙模块
     * @returns {Promise}
     */
    closeBle() {
        return new Promise((resolve, reject) => {
            uni.closeBluetoothAdapter({
                success: () => {
                    resolve()
                },
                fail: (err) => {
                    reject(err)
                }
            });
        })
    }

    /**
     * 将十六进制字符串转换为十进制数字。
     *
     * @param {string} hexString - 要转换的十六进制字符串。
     * @returns {number} - 转换后的十进制数字。
     */
    hexToDecimal(hexString) {
        if (!dataTypeJudge(hexString, 'string')) {
            console.log(`${hexString}必须是string`)
            return 0
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
     * @param {number} decimalNumber - 要转换的十进制数字。
     * @param {number} [byteCount=2] - 要返回的字节数，默认为 2。
     * @returns {string} - 转换后的十六进制字符串，补足到指定字节数。
     */
    decimalToHex(decimalNumber, byteCount = 2) {
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
     * 将十六进制字符串分割成指定长度的部分。
     *
     * @param {string} hexString - 要分割的十六进制字符串。
     * @param {number} partLength - 每部分的字符长度，默认为2。
     * @returns {Array<string>} - 分割后的十六进制字符串数组。
     */
    splitHexString(hexString, partLength = 2) {
        if (!dataTypeJudge(hexString, 'string')) {
            console.log(`${hexString}必须是string`)
            return []
        }
        let parts = [];
        for (let i = 0; i < hexString.length; i += partLength) {
            parts.push(hexString.substring(i, i + partLength)); // 使用 substring
        }
        return parts;
    }

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

/*-------------------------------------------------------------------------------------*/
/**
 * 根据目标 MAC 地址和过滤后的蓝牙设备列表获取目标设备 ID
 * @param {string} targetMACAddress - 目标 MAC 地址
 * @param {Array} filteredBluetoothDevices - 过滤后的蓝牙设备列表
 * @returns {string|null} 目标设备 ID 或 null
 */
function getTargetDeviceId(targetMACAddress, filteredBluetoothDevices) {
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    if (macRegex.test(targetMACAddress)) {
        const formattedMACCache = {}; // 缓存格式化后的 MAC 地址
        if (osName === 'android') {
            const device = filteredBluetoothDevices.find(item => item.deviceId === targetMACAddress.trim());
            return device ? targetMACAddress : null;
        } else if (osName === 'ios') {
            const deviceMap = new Map(); // 使用 Map 作为哈希表
            for (const device of filteredBluetoothDevices) {
                const formattedMAC = formattedMACCache[device.advertisData] || (formattedMACCache[device.advertisData] = formatMACAddress(getUniqueIDFromBuffer(device.advertisData)));
                deviceMap.set(formattedMAC, device.deviceId);
            }
            const deviceId = deviceMap.get(targetMACAddress.trim());
            return deviceId || null;
        }
    }
    return targetMACAddress; // 如果不是 MAC 地址格式，直接返回原值
}

// 辅助函数
function getUniqueIDFromBuffer(buffer) {
    const bytes = new Uint8Array(buffer);
    return bytes.reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '');
}
