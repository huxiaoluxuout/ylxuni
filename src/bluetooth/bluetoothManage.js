import {singletonHandler} from "../utils/singletonHandler.js";


let searchTimeout = null
let osName = 'ios'


/**
 * @class BluetoothManager
 * 该类用于管理蓝牙设备的连接、搜索和数据通信。
 */
class BluetoothManager {
    static retryCount = 0

    static connectionTimeout = null
    static serviceUUIDs = []
    static filteredBluetoothDevices = [];


    static connectDevice = {
        deviceId: '',
        serviceId: '',

        characteristicUUIds: '',
        writeUUID: '',
        notifyUUID: '',
    }

    constructor(serviceUUIDs = []) {

        // BluetoothManager.retryCount = 0;
        // BluetoothManager.serviceUUIDs = serviceUUIDs;

        // name 或 advertisServiceUUIDs

        uni.getSystemInfo({
            success(res) {
                console.log('getSystemInfo', res)
                osName = res.osName
            }
        })
    }

    /**
     * 初始化蓝牙模块
     * @returns {Promise}
     */

    init() {
        return new Promise((resolve, reject) => {
            uni.openBluetoothAdapter({
                success(res) {

                    BluetoothManager.startDeviceSearch(resolve, reject)
                },
                fail: err => {
                    reject(err);
                }
            });
        });
    }

    /**
     * 开始搜索蓝牙设备
     * @param {Function} resolve
     * @param {Function} reject
     */
    static startDeviceSearch(resolve, reject) {

        uni.startBluetoothDevicesDiscovery({

            success() {
                searchTimeout = setTimeout(() => {
                    BluetoothManager.getBluetoothDevices(resolve, reject);
                }, 3000);
            },

            fail(err) {
                reject(err);
                uni.showToast({
                    icon: "none",
                    title: "查找设备失败！",
                    duration: 3000
                });
            }
        });
    }

    /**
     * 重新搜索附近的蓝牙设备
     * @returns {Promise}
     */
    searchDevicesAgain() {
        return new Promise((resolve, reject) => {
            BluetoothManager.startDeviceSearch(resolve, reject);
        });
    }

    /**
     * 获取搜索到的蓝牙设备列表
     * @param {Function} resolve
     * @param {Function} reject
     */
    static getBluetoothDevices(resolve, reject) {
        uni.getBluetoothDevices({
            success(res) {
                console.log('原始蓝牙列表数据', res)
                if (searchTimeout) {
                    clearTimeout(searchTimeout);
                }

                if (res.devices.length === 0) {
                    reject(new Error('未找到蓝牙设备'));
                    return;
                }

                let bluetoothDevices = res.devices.filter(item => (item.name === 'MA5011Pro'||item.localName === 'MA5011Pro'));

                /*   let bluetoothDevices = res.devices.filter(item => {
                       if (item.name.trim() === 'MA5011Pro') {
                           if (item.advertisData) {
                               item.MACID = getUniqueIDFromBuffer(item.advertisData)
                           }
                           return item
                       }
                   })*/
                resolve(bluetoothDevices);
            },
            fail(err) {
                reject(err);
                uni.showToast({
                    title: '搜索蓝牙设备失败或附近暂无可用的蓝牙设备',
                    icon: 'none',
                    duration: 3000
                });
            },
            complete: () => BluetoothManager.stopDeviceSearch()
        });
    }

    /**
     * 停止蓝牙设备搜索
     */
    static stopDeviceSearch() {
        uni.stopBluetoothDevicesDiscovery({
            success: () => console.log('停止搜索蓝牙')
        });
    }

    /**
     * 监听蓝牙连接状态
     */
    static onConnectionStateChange() {
        uni.onBLEConnectionStateChange(res => {
            console.log('蓝牙连接状态变化:', res);
            // 可添加连接状态变化的处理逻辑
        });
    }

    /**
     * 获取蓝牙设备的服务UUID
     * @param {Function} resolve
     * @param {Function} reject
     */

    static getServiceUUIDs(resolve, reject) {
        console.log('getServiceUUIDs', BluetoothManager.connectDevice)
        uni.getBLEDeviceServices({
            deviceId: BluetoothManager.connectDevice.deviceId,
            success(res) {
                if (res.services && res.services.length) {
                    BluetoothManager.onConnectionStateChange();
                    BluetoothManager.connectDevice.serviceId = res.services[3].uuid;

                    BluetoothManager.getCharacteristicUUIDs(resolve, reject);
                    if (BluetoothManager.connectionTimeout) {
                        clearTimeout(BluetoothManager.connectionTimeout);
                    }
                } else {

                    reject(new Error('未找到服务UUID'));
                }
            },
            fail(err) {
                reject(err);

                /*if (BluetoothManager.retryCount < 10) {
                    this.connectToDevice(BluetoothManager.boundDeviceInfo.deviceId)
                        .then(() => {
                            BluetoothManager.retryCount = 0;
                        })
                        .catch(() => {
                            BluetoothManager.retryCount++;
                        });
                } else {
                    reject(err);
                }*/
            }
        });
    }


    /**
     * 获取蓝牙设备的特征UUID，并开始监听
     * @param {Function} resolve
     * @param {Function} reject
     */
    static getCharacteristicUUIDs(resolve, reject) {
        const {deviceId, serviceId} = BluetoothManager.connectDevice;
        console.log('特征UUID', {deviceId, serviceId})
        uni.getBLEDeviceCharacteristics({
            deviceId,
            serviceId,
            success(res) {
                console.log('获取蓝牙设备的特征UUID', res)

                if (!res.characteristics.length) {
                    reject(new Error('未找到所需的特征UUID'));
                    return;
                }

                BluetoothManager.connectDevice.characteristicUUIds = res.characteristics;

                BluetoothManager.connected()
                resolve(BluetoothManager.connectDevice)
                // BluetoothManager.startNotify(resolve, reject);
            },
            fail(err) {
                reject(err);
            }
        });
    }


    static connected() {
        console.log('连接成功', BluetoothManager.connectDevice)
        uni.showToast({title: 'OK', icon: 'none', duration: 1800});
        uni.$emit('connectedBle', BluetoothManager.connectDevice);

    }

    /**
     * 启动蓝牙通知监听
     * @param {Function} resolve
     * @param {Function} reject
     */
    static startNotify(resolve, reject) {
        const {deviceId, serviceId, notifyUUID} = BluetoothManager.connectDevice;
        uni.notifyBLECharacteristicValueChange({
            state: true,
            deviceId,
            serviceId,
            characteristicId: notifyUUID,
            success(res) {
                resolve(res, BluetoothManager.connectDevice);
            },
            fail(err) {
                reject(err);
            }
        });
    }

    /**
     * 连接指定蓝牙设备
     * @param {string} deviceId - 设备ID
     * @returns {Promise}
     */
    connect(deviceId) {
        console.log('deviceId', deviceId)


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

    /**
     * 向蓝牙设备写入指令
     * @param {string} instruction - 指令的16进制字符串
     * @param {string} writeUUID - 特征UUID
     * @param {function} [readCallback] - 数据回调
     * @returns {Promise}
     */
    write(instruction, writeUUID,readCallback) {
        const {deviceId, serviceId} = BluetoothManager.connectDevice;
        // console.log('write', instruction, characteristicId)
        return new Promise((resolve, reject) => {
            uni.writeBLECharacteristicValue({
                deviceId,
                serviceId,
                characteristicId: writeUUID,
                value: hexToArrayBuffer(instruction),
                success(res) {
                    // console.log('write-------',res)
                    BluetoothManager.callbackFns.write.characteristicId = writeUUID
                    BluetoothManager.callbackFns.write.callback = readCallback
                    resolve(res)
                },
                fail(fail) {
                    reject(fail)
                },
            })

        });

    }



    /**
     * 读取蓝牙数据
     * @param {string} readUUID 读取的特征uuid
     * @param {Function} readCallback
     * @param {Function} errCallback
     */
    read(readUUID,readCallback,errCallback) {
        if(!BluetoothManager.callbackFns.red.characteristicId){
            BluetoothManager.onDeviceData();

        }
        const {deviceId, serviceId} = BluetoothManager.connectDevice;
        // console.log('read',{deviceId, serviceId})
        uni.readBLECharacteristicValue({
            deviceId,
            serviceId,
            characteristicId:readUUID,
            success: (res) => {
                // console.log('read',res)
                BluetoothManager.callbackFns.red.characteristicId = readUUID
                BluetoothManager.callbackFns.red.callback = readCallback
            },
            fail: (err) => {
                console.error('读取数据失败', err);
                errCallback(err)
            }
        });
    }

    /**
     * 断开与蓝牙设备的连接
     * @param {string} deviceId - 设备ID
     * @returns {Promise}
     */
    async disconnect(deviceId) {
        let closeBLEConnection = promisify(uni.closeBLEConnection);
        return await closeBLEConnection({
            deviceId,
        });
    }

    /**
     * 关闭蓝牙模块
     * @returns {Promise}
     */
    async close() {
        let closeBLEConnection = promisify(uni.closeBluetoothAdapter);
        return await closeBLEConnection({});

    }

    /**
     * 接收蓝牙设备返回的数据
     */
    static onDeviceData() {
        let fullData = '';
        const endMarker = '00'; // 根据实际情况设置结束标记
        uni.onBLECharacteristicValueChange(res => {
            const hexString = ab2hex(res.value);
            console.log('hexString',hexString)
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

    /**
     * 十进制数字转换为十六进制
     * @param {number} decimalNumber
     * @returns {}
     *
     */

    decimalToHexWithPadding(decimalNumber) {
        if (typeof decimalNumber !== 'number' || !Number.isInteger(decimalNumber)) {
            throw new Error('Input must be an integer.');
        }

        // 将十进制数字转换为十六进制，并补足到至少四个字符长度
        let hexString = decimalNumber.toString(16).toUpperCase().padStart(4, '0');

        // 分割成高八位和低八位
        let highByte = hexString.slice(0, 2);
        let lowByte = hexString.slice(2, 4);

        return highByte+lowByte ;
    }
}


// 返回Promise对象
 function promisify(api) {
    return (options, ...params) => {
        return new Promise((resolve, reject) => {
            api(Object.assign({}, options, { success: resolve, fail: reject }), ...params);
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

function ab2hex(buffer) {
    return Array.from(new Uint8Array(buffer), bit => ('00' + bit.toString(16)).slice(-2)).join('');
}


export const YlxBluetoothManager = new Proxy(BluetoothManager, singletonHandler(BluetoothManager));
