/*
// import {singletonHandler} from "../utils/singletonHandler.js";
import {dataTypeJudge} from "../utils/dataTypeJudge.js";


let searchTimeout = null
let osName = 'ios'


/!**
 * @class BluetoothManager
 * 该类用于管理蓝牙设备的连接、搜索和数据通信。
 *!/
export class BluetoothManager {
    static connectionTimeout = null

    static connectDevice = {
        deviceId: '',
        connectServiceInfo: {
            serviceId: '',
            characteristicUUIds: []
        },
        services: []
    }

    static platform = null
    static name = ''
    static localName = ''
    static searchTime = 3000

    /!**
     *
     * @param platform
     * @param serviceUUIDs
     * @param name
     * @param localName
     * @param deviceId
     *
     *!/
    constructor(platform, {advertisServiceUUIDs, name, localName, deviceId, serviceId} = {advertisServiceUUIDs: [], name: '', localName: '', deviceId: '', serviceId}) {
        /!**
         *  @type {{ getSystemInfo: function(): void }}
         * *!/
        BluetoothManager.platform = platform

        BluetoothManager.advertisServiceUUIDs = advertisServiceUUIDs
        BluetoothManager.name = name
        BluetoothManager.localName = localName
        BluetoothManager.deviceId = deviceId

        BluetoothManager.connectDevice.connectServiceInfo.serviceId = serviceId;


        uni.getSystemInfo({
            success(res) {
                console.log(`res.osName:${res.osName}`)
                osName = res.osName
            }
        })
    }

    /!**
     * 初始化蓝牙模块
     * @returns {Promise}
     *!/

    init() {
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

    /!**
     * 开始搜索蓝牙设备
     * @param {Function} resolve
     * @param {Function} reject
     *!/
    static startDeviceSearch(resolve, reject) {
        // services
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

    /!**
     * 重新搜索附近的蓝牙设备
     * @returns {Promise}
     *!/
    searchDevicesAgain() {
        return new Promise((resolve, reject) => {
            BluetoothManager.startDeviceSearch(resolve, reject);
        });
    }

    /!**
     * 获取搜索到的蓝牙设备列表
     * @param {Function} resolve
     * @param {Function} reject
     *!/
    static getBluetoothDevices(resolve, reject) {
        uni.getBluetoothDevices({
            success(res) {
                console.log(`原始蓝牙列表数据: ${JSON.stringify(res)}`)
                if (searchTimeout) {
                    clearTimeout(searchTimeout);
                }

                if (res.devices.length === 0) {
                    reject(new Error('未找到蓝牙设备'));
                    return;
                }

                // let bluetoothDevices = res.devices.filter(item => (item.name === 'LT5009NEW' || item.name === 'MA5011Pro' || item.localName === 'MA5011Pro'));

                let bluetoothDevices = res.devices.filter(item => (item.name === BluetoothManager.name || item.localName === BluetoothManager.localName));

                /!*   let bluetoothDevices = res.devices.filter(item => {
                       if (item.name.trim() === 'MA5011Pro') {
                           if (item.advertisData) {
                               item.MACID = getUniqueIDFromBuffer(item.advertisData)
                           }
                           return item
                       }
                   })*!/
                resolve(bluetoothDevices);
            },
            fail(err) {
                reject(err);
            },
            complete: () => BluetoothManager.stopDeviceSearch()
        });
    }

    /!**
     * 停止蓝牙设备搜索
     *!/
    static stopDeviceSearch() {
        uni.stopBluetoothDevicesDiscovery({
            success: () => console.log('停止搜索蓝牙')
        });
    }

    /!**
     * 监听蓝牙连接状态
     *!/
    static onConnectionStateChange() {
        uni.onBLEConnectionStateChange(res => {
            console.log(`蓝牙连接状态变化:${JSON.stringify(res)}`,);
            // 可添加连接状态变化的处理逻辑
        });
    }

    /!**
     * 获取蓝牙设备的服务UUID
     * @param {Function} resolve
     * @param {Function} reject
     *!/

    static getServiceUUIDs(resolve, reject) {
        // console.log(`getServiceUUIDs：${JSON.stringify({services: BluetoothManager.connectDevice})}`)
        uni.getBLEDeviceServices({
            deviceId: BluetoothManager.connectDevice.deviceId,
            success(res) {
                if (res.services && res.services.length) {
                    BluetoothManager.onConnectionStateChange();
                    console.log(`services: ${JSON.stringify(res)}`)
                    // BluetoothManager.connectDevice.serviceId = res.services[3].uuid;

                    // BluetoothManager.connectDevice.services = res.services;

                    BluetoothManager.connectDevice.connectServiceInfo.characteristicUUIds = res.services;

                    // BluetoothManager.getCharacteristicUUIDs(resolve, reject);
                    resolve(BluetoothManager.connectDevice)

                    if (BluetoothManager.connectionTimeout) {
                        clearTimeout(BluetoothManager.connectionTimeout);
                    }
                } else {

                    reject(new Error('未找到服务UUID'));
                }
            },
            fail(err) {
                reject(err);
            }
        });
    }

    /!**
     * 获取蓝牙设备的特征UUID，并开始监听
     * @param {string} characteristicId
     * @param {string} [serviceId]
     * @param {function} successCallback
     * @param {function} [failCallback]
     *!/
    getCharacteristicUUIDs(characteristicId, successCallback, failCallback, serviceId = BluetoothManager.connectDevice.connectServiceInfo.serviceId) {
        const {deviceId} = BluetoothManager.connectDevice;
        return new Promise((resolve, reject) => {
            uni.getBLEDeviceCharacteristics({
                deviceId,
                serviceId,
                success(res) {
                    console.log(`获取蓝牙设备的特征UUID:-${JSON.stringify(res)}`,)

                    if (!res.characteristics.length) {
                        reject(new Error('未找到所需的特征UUID'));
                        return;
                    }

                    BluetoothManager.connectDevice.connectServiceInfo.characteristicUUIds = res.characteristics;
                    resolve(BluetoothManager.connectDevice)
                    BluetoothManager.startNotify(serviceId, characteristicId, successCallback, failCallback);
                },
                fail(err) {
                    reject(err);
                }
            });
        })

    }

    /!**
     * 启动蓝牙通知监听
     * @param {string} serviceId - 服务uuid
     * @param {string} characteristicId - 特征值的 uuid
     * @param {function} successCallback
     * @param {function} failCallback
     *!/
    static startNotify(serviceId, characteristicId, successCallback, failCallback) {
        const {deviceId} = BluetoothManager.connectDevice;
        uni.notifyBLECharacteristicValueChange({
            state: true,
            deviceId,
            serviceId,
            characteristicId,
            success(res) {
                uni.onBLECharacteristicValueChange(res => {
                    const hexString = ab2hex(res.value);
                    console.log(`hexString: ${hexString} ${JSON.stringify(res)}`)
                });
                successCallback(res)
            },
            fail(err) {
                failCallback(err)
            }
        });
    }

    /!**
     * 连接指定蓝牙设备
     * @param {string} deviceId - 设备ID
     * @returns {Promise}
     *!/
    connect(deviceId) {
        console.log(`deviceId：${deviceId}`)

        return new Promise((resolve, reject) => {
            uni.createBLEConnection({
                deviceId: deviceId,
                success: (res) => {
                    BluetoothManager.connectDevice.deviceId = deviceId

                    BluetoothManager.connectionTimeout = setTimeout(() => {
                        BluetoothManager.getServiceUUIDs(resolve, reject);
                    }, 1500);

                    // resolve(res)
                },
                fail: err => {
                    reject(err);
                }
            });
        });
    }

    // 读取数据
    static callbackFns = {
        red: {
            characteristicId: '',
            callback: function () {

            }
        },

        write: {
            characteristicId: '',
            callback: function () {

            }
        }
    }

    /!**
     * 向蓝牙设备写入指令
     * @param {string} instruction - 指令的16进制字符串
     * @param {string} characteristicId - 特征UUID
     * @param {function} [readCallback] - 数据回调
     * @returns {Promise}
     *!/
    write(instruction, characteristicId, readCallback) {
        const {deviceId, connectServiceInfo: {serviceId}} = BluetoothManager.connectDevice;

        return new Promise((resolve, reject) => {
            uni.writeBLECharacteristicValue({
                deviceId,
                serviceId,
                characteristicId: characteristicId,
                value: hexToArrayBuffer(instruction),
                success(res) {
                    BluetoothManager.callbackFns.write.characteristicId = characteristicId
                    BluetoothManager.callbackFns.write.callback = readCallback
                    resolve(res)
                },
                fail(fail) {
                    reject(fail)
                },
            })

        });

    }


    /!**
     * 读取蓝牙数据
     * @param {string} characteristicId 读取的特征uuid
     * @param {Function} readCallback
     * @param {Function} [errCallback = ()=>{}]
     * @param {string} [endMarker = ''] - 结束标记
     *!/
    read(characteristicId, readCallback, errCallback, endMarker = '') {
        if (!BluetoothManager.callbackFns.red.characteristicId) {
            BluetoothManager.onDeviceData();

        }
        const {deviceId, connectServiceInfo: {serviceId}} = BluetoothManager.connectDevice;

        uni.readBLECharacteristicValue({
            deviceId,
            serviceId,
            characteristicId: characteristicId,
            success: () => {
                BluetoothManager.callbackFns.red.characteristicId = characteristicId
                BluetoothManager.callbackFns.red.callback = readCallback
            },
            fail: (err) => {
                console.error(`读取数据失败: ${JSON.stringify(err)}`);
                errCallback(err)
            }
        });
    }

    /!**
     * 断开与蓝牙设备的连接
     * @param {string} deviceId - 设备ID
     * @returns {Promise}
     *!/
    async disconnect(deviceId) {
        let closeBLEConnection = promisify(uni.closeBLEConnection);
        return await closeBLEConnection({
            deviceId,
        });
    }

    /!**
     * 关闭蓝牙模块
     * @returns {Promise}
     *!/
    async close() {
        let closeBLEConnection = promisify(uni.closeBluetoothAdapter);
        return await closeBLEConnection({});

    }

    /!**
     * 接收蓝牙设备返回的数据
     * @param {string} [endMarker] - 结束标记
     *!/
    static onDeviceData(endMarker = '') {
        let fullData = '';

        uni.onBLECharacteristicValueChange(res => {
            const hexString = ab2hex(res.value);
            console.log(`000-hexString: ${hexString}`,)
            fullData += hexString;
            if (fullData.endsWith(endMarker)) {
                if (BluetoothManager.callbackFns.red.characteristicId === res.characteristicId) {
                    BluetoothManager.callbackFns.red.callback(fullData)
                }
                if (BluetoothManager.callbackFns.write.characteristicId === res.characteristicId) {
                    BluetoothManager.callbackFns.write.callback(fullData)
                }

                fullData = '';
            }
        });
    }

    /!**
     * 将十进制数字转换为十六进制，并支持手动设置返回的字节数。
     *
     * @param {number} decimalNumber - 要转换的十进制数字。
     * @param {number} [byteCount=2] - 要返回的字节数，默认为 2。
     * @returns {string} - 转换后的十六进制字符串，补足到指定字节数。
     *!/
    decimalToHexWithPadding(decimalNumber, byteCount = 2) {
        // 将十进制数字转换为十六进制，并转换为大写
        let hexString = decimalNumber.toString(16).toUpperCase();

        // 计算需要补足的长度
        let requiredLength = byteCount * 2; // 每个字节需要两个十六进制字符
        hexString = hexString.padStart(requiredLength, '0');

        // 按字节分割
        let result = [];
        for (let i = 0; i < requiredLength; i += 2) {
            result.push(hexString.slice(i, i + 2));
        }

        return result.join(''); // 返回拼接后的结果
    }

    /!**
     * 将十六进制字符串转换为十进制数字。
     *
     * @param {string} hexString - 要转换的十六进制字符串。
     * @returns {number} - 转换后的十进制数字。
     *!/
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

    /!**
     * 将十六进制字符串分割成指定长度的部分。
     *
     * @param {string} hexString - 要分割的十六进制字符串。
     * @param {number} partLength - 每部分的字符长度，默认为2。
     * @returns {Array<string>} - 分割后的十六进制字符串数组。
     *!/
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


// 返回Promise对象
function promisify(api) {
    return (options, ...params) => {
        return new Promise((resolve, reject) => {
            api(Object.assign({}, options, {success: resolve, fail: reject}), ...params);
        });
    }
}

// 16进制转成2进制
function hexToArrayBuffer(instruction) {
    return new Uint8Array(instruction.match(/[\da-f]{2}/gi).map(ii => parseInt(ii, 16))).buffer
}

// 辅助函数
function getUniqueIDFromBuffer(buffer) {
    const bytes = new Uint8Array(buffer);
    return bytes.reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '');
}

function formatMACAddress(macAddress) {
    if (!macAddress || typeof macAddress !== 'string') {
        return macAddress;
    }
    return macAddress.match(/.{1,2}/g).join(':').toUpperCase();
}

/!**
 * 根据目标 MAC 地址和过滤后的蓝牙设备列表获取目标设备 ID
 * @param {string} targetMACAddress - 目标 MAC 地址
 * @param {Array} filteredBluetoothDevices - 过滤后的蓝牙设备列表
 * @returns {string|null} 目标设备 ID 或 null
 *!/
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

function ab2hex(buffer) {
    return Array.from(new Uint8Array(buffer), bit => ('00' + bit.toString(16)).slice(-2)).join('');
}


// export const YlxBluetoothManager = new Proxy(BluetoothManager, singletonHandler(BluetoothManager));
*/
