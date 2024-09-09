import {singletonHandler} from "../utils/singletonHandler.js";

/**
 * @class BluetoothManager
 * 该类用于管理蓝牙设备的连接、搜索和数据通信。
 */
class BluetoothManager {
    static retryCount = 0
    static searchTimeout = null
    static connectionTimeout = null
    static osName = 'ios'
    static serviceUUIDs = []
    static filteredBluetoothDevices = [];

    static boundDeviceInfo = {
        deviceId: '',
        serviceId: '',
        writeId: '',
        notifyId: '',
    };

    constructor(serviceUUIDs = ['0000AF30-0000-1000-8000-00805F9B34FB']) {

        BluetoothManager.retryCount = 0;
        BluetoothManager.serviceUUIDs = serviceUUIDs;

        uni.getSystemInfo({
            success: (res) => {
                BluetoothManager.osName = res.osName
            }
        })
    }

    /**
     * 初始化蓝牙模块
     * @param {Function} bleValueCallback - 蓝牙值变化的回调函数
     * @returns {Promise}
     */
    initializeBluetooth(bleValueCallback = () => {
    }) {
        uni.$off('bleVal');
        uni.$on('bleVal', bleValueCallback);
        return new Promise((resolve, reject) => {
            uni.openBluetoothAdapter({
                success: () => BluetoothManager.startDeviceSearch(resolve, reject),
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
            services: BluetoothManager.serviceUUIDs,
            success: () => {
                BluetoothManager.searchTimeout = setTimeout(() => {
                    BluetoothManager.getBluetoothDevices(resolve, reject);
                }, 3000);
            },
            fail: err => {
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
     * 监听蓝牙设备发现事件
     * @param {Function} callback
     */
    static onDeviceFound(callback) {
        uni.onBluetoothDeviceFound(callback);
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
            success: res => {
                if (BluetoothManager.searchTimeout) {
                    clearTimeout(BluetoothManager.searchTimeout);
                }
                BluetoothManager.filteredBluetoothDevices = res.devices;
                if (BluetoothManager.filteredBluetoothDevices.length === 0) {
                    reject(new Error('未找到蓝牙设备'));
                    return;
                }
                BluetoothManager.filteredBluetoothDevices.forEach(item => {
                    item.MACID = formatMACAddress(getUniqueIDFromBuffer(item.advertisData));
                });
                resolve(BluetoothManager.filteredBluetoothDevices);
            },
            fail: err => {
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
     * 连接指定蓝牙设备
     * @param {string} deviceId - 设备ID
     * @returns {Promise}
     */
    connectToDevice(deviceId) {
        const targetDeviceId = getTargetDeviceId(deviceId, BluetoothManager.filteredBluetoothDevices);
        if (!targetDeviceId) {
            return Promise.reject(new Error('无效的设备ID'));
        }
        BluetoothManager.boundDeviceInfo.deviceId = targetDeviceId;
        return new Promise((resolve, reject) => {
            uni.createBLEConnection({
                deviceId: BluetoothManager.boundDeviceInfo.deviceId,
                success: () => {
                    BluetoothManager.connectionTimeout = setTimeout(() => {
                        BluetoothManager.getServiceUUIDs(resolve, reject);
                    }, 500);
                },
                fail: err => {
                    reject(err);
                }
            });
        });
    }

    /**
     * 获取蓝牙设备的服务UUID
     * @param {Function} resolve
     * @param {Function} reject
     */
    static getServiceUUIDs(resolve, reject) {
        uni.getBLEDeviceServices({
            deviceId: BluetoothManager.boundDeviceInfo.deviceId,
            success: res => {
                if (res.services && res.services.length) {
                    BluetoothManager.onConnectionStateChange();
                    BluetoothManager.boundDeviceInfo.serviceId = res.services[0].uuid;
                    BluetoothManager.getCharacteristicUUIDs(resolve, reject);
                    if (BluetoothManager.connectionTimeout) {
                        clearTimeout(BluetoothManager.connectionTimeout);
                    }
                } else {
                    reject(new Error('未找到服务UUID'));
                }
            },
            fail: err => {
                if (BluetoothManager.retryCount < 10) {
                    this.connectToDevice(BluetoothManager.boundDeviceInfo.deviceId)
                        .then(() => {
                            BluetoothManager.retryCount = 0;
                        })
                        .catch(() => {
                            BluetoothManager.retryCount++;
                        });
                } else {
                    reject(err);
                }
            }
        });
    }

    /**
     * 获取蓝牙设备的特征UUID，并开始监听
     * @param {Function} resolve
     * @param {Function} reject
     */
    static getCharacteristicUUIDs(resolve, reject) {
        uni.getBLEDeviceCharacteristics({
            deviceId: BluetoothManager.boundDeviceInfo.deviceId,
            serviceId: BluetoothManager.boundDeviceInfo.serviceId,
            success: res => {
                const notifyCharacteristic = res.characteristics.find(item => item.properties.notify);
                const writeCharacteristic = res.characteristics.find(item => item.properties.write);

                if (!notifyCharacteristic || !writeCharacteristic) {
                    reject(new Error('未找到所需的特征UUID'));
                    return;
                }

                BluetoothManager.boundDeviceInfo.notifyId = notifyCharacteristic.uuid;
                BluetoothManager.boundDeviceInfo.writeId = writeCharacteristic.uuid;
                uni.showToast({title: '连接成功', icon: 'none', duration: 800});
                uni.$emit('connectedBluetooth', BluetoothManager.boundDeviceInfo);

                BluetoothManager.startNotification(resolve, reject);
            },
            fail: err => {
                reject(err);
            }
        });
    }

    /**
     * 启动蓝牙通知监听
     * @param {Function} resolve
     * @param {Function} reject
     */
    static startNotification(resolve, reject) {
        const {deviceId, serviceId, notifyId} = BluetoothManager.boundDeviceInfo;
        uni.notifyBLECharacteristicValueChange({
            state: true,
            deviceId,
            serviceId,
            characteristicId: notifyId,
            success: res => {
                resolve(res, BluetoothManager.boundDeviceInfo);
                this.onDataReceived();
            },
            fail: err => {
                reject(err);
            }
        });
    }

    /**
     * 接收蓝牙设备返回的数据
     */
    onDataReceived() {
        let fullData = '';
        const endMarker = ''; // 根据实际情况设置结束标记
        uni.onBLECharacteristicValueChange(res => {
            const hexString = ab2hex(res.value);
            fullData += hexString;
            if (fullData.endsWith(endMarker)) {
                uni.$emit('bleVal', fullData);
                fullData = '';
            }
        });
    }

    /**
     * 向蓝牙设备写入指令
     * @param {string} instruction - 指令的16进制字符串
     * @returns {Promise}
     */
    writeInstructionToDevice(instruction) {
        const {deviceId, serviceId, writeId} = BluetoothManager.boundDeviceInfo;
        const arrayBuffer = new Uint8Array(instruction.match(/[\da-f]{2}/gi).map(ii => parseInt(ii, 16))).buffer;

        return new Promise((resolve, reject) => {
            uni.writeBLECharacteristicValue({
                deviceId,
                serviceId,
                characteristicId: writeId,
                value: arrayBuffer,
                success: res => {
                    resolve(res);
                },
                fail: err => {
                    reject(err);
                    if (err.errCode === 10006) {
                        uni.showModal({
                            content: '连接已断开',
                            showCancel: false
                        });
                    }
                }
            });
        });
    }

    /**
     * 断开与蓝牙设备的连接
     * @param {string} deviceId - 设备ID
     * @returns {Promise}
     */
    disconnectDevice(deviceId) {
        return new Promise((resolve, reject) => {
            uni.closeBLEConnection({
                deviceId,
                success: res => {
                    resolve(res);
                },
                fail: err => {
                    reject(err);
                }
            });
        });
    }

    /**
     * 关闭蓝牙模块
     * @returns {Promise}
     */
    closeBluetoothModule() {
        return new Promise((resolve, reject) => {
            uni.closeBluetoothAdapter({
                success: res => resolve(res),
                fail: err => reject(err)
            });
        });
    }
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

/*function getTargetDeviceId(targetMACAddress, filteredBluetoothDevices) {
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    if (macRegex.test(targetMACAddress)) {
        if (this.osName === 'android') {
            const device = filteredBluetoothDevices.find(item => item.deviceId === targetMACAddress.trim());
            return device ? targetMACAddress : null;
        } else if (this.osName === 'ios') {
            const device = filteredBluetoothDevices.find(item => targetMACAddress.trim() === formatMACAddress(getUniqueIDFromBuffer(item.advertisData)));
            return device ? device.deviceId : null;
        }
    }
    return targetMACAddress; // 如果不是MAC地址格式，直接返回原值
}*/
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
        if (BluetoothManager.osName === 'android') {
            const device = filteredBluetoothDevices.find(item => item.deviceId === targetMACAddress.trim());
            return device ? targetMACAddress : null;
        } else if (BluetoothManager.osName === 'ios') {
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

function hex2int(hex) {
    return parseInt(hex, 16);
}


export const YlxBluetoothManager = new Proxy(BluetoothManager, singletonHandler(BluetoothManager));
