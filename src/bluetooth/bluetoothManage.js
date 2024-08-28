// #ifdef MP
export class BluetoothManage {
    bindDeviceInfo = {
        deviceId: '',
        serviceId: '',
        writeId: '',
        notifyId: '',
    }
    bluetoothDevicesFilteredList = []

    timer1 = null
    timer2 = null

    config = {
        isAutoConnect: false,
        deviceId: '',
    }
    num = 0
    services = ['0000AF30-0000-1000-8000-00805F9B34FB']

    constructor(servicesUUID) {
        this.services = servicesUUID
    }

    // 1.初始化蓝牙
    initBle(services = this.services, bleValCallback = () => {}) {
        uni.$off('bleVal', bleValCallback)
        uni.$on('bleVal', bleValCallback)
        const that = this
        that.services = services
        return new Promise((resolve, reject) => {
            uni.openBluetoothAdapter({
                success(res) {
                    // console.log('初始化蓝牙', res);
                    that.startSearchBle(resolve, reject);
                },
                fail(err) {
                    reject(err)
                    uni.showToast({
                        title: '请检查是否拥有蓝牙权限',
                        icon: 'none',
                        duration: 3500
                    })
                }
            })
        })
    }

    // 2.打开蓝牙搜索功能
    startSearchBle(resolve, reject) {
        const that = this

        uni.startBluetoothDevicesDiscovery({
            services: that.services,
            success(res) {
                // console.log('蓝牙开启搜索', res)
                that.timer1 = setTimeout(() => { //加个延迟、目的是为了设备搜索完毕再获取列表，不然获取为空列表
                    that.searchAllBleDevices(resolve, reject)
                }, 3000)
                // that.onDeviceFound()
            },
            fail(err) {
                reject(err)
                console.error("查找设备失败!");
                uni.showToast({
                    icon: "none",
                    title: "查找设备失败！",
                    duration: 3000
                })
            }
        })
    }

    // 2.1 监听寻找到新设备的事件
    onDeviceFound(callback) {
        uni.onBluetoothDeviceFound(callback)
    }

    // 2.2 重新搜索附近设备
    searchBleAgain() {
        const that = this
        return new Promise((resolve, reject) => {
            that.startSearchBle(resolve, reject);
        })
    }

    // 3.搜索到的蓝牙列表
    searchAllBleDevices(resolve, reject) {
        const that = this

        uni.getBluetoothDevices({
            success(res) {
                console.log('周围蓝牙设备列表', res.devices)
                clearTimeout(that.timer1);
                that.bluetoothDevicesFilteredList = res.devices
                if (that.bluetoothDevicesFilteredList.length === 0) {
                    console.log('附近暂无可用的蓝牙设备，请尝试下拉刷新重试')
                    reject([])
                    return
                }
                that.bluetoothDevicesFilteredList.forEach(item => {
                    item.MACID = formatMACAddress(getUniqueIDFromBuffer(item.advertisData))
                })
                resolve(that.bluetoothDevicesFilteredList)
            },
            fail(err) {
                console.error("搜索蓝牙设备失败");
                reject(err)
                uni.showToast({title: '搜索蓝牙设备失败或附近暂无可用的蓝牙设备', icon: 'none', duration: 3000})
            },
            complete() {
                that.stopSearchBle()
            }
        })
    }

    // 3.1 停止搜索蓝牙
    stopSearchBle() {
        uni.stopBluetoothDevicesDiscovery({
            success(res) {
                console.log('停止搜索蓝牙', res)
            }
        })
    }

    // 3.2 监听蓝牙连接状态
    onNoticeConnection() {
        uni.onBLEConnectionStateChange((res) => {
        })
    }

    // 4.蓝牙连接 根据某一id连接设备
    // deviceId  D8:2F:E6:59:E8:7E
    connectBleDevice(deviceId) {
        const that = this

        that.bindDeviceInfo.deviceId = getTargetDeviceId(deviceId, that.bluetoothDevicesFilteredList)
        return new Promise((resolve, reject) => {
            uni.createBLEConnection({
                deviceId: that.bindDeviceInfo.deviceId, //最终连接的设备id
                success(res) {
                    // console.log('开始连接蓝牙', res)
                    that.timer2 = setTimeout(() => {
                        that.getServiceId(resolve, reject);
                    }, 500) //加个延迟、目的是为了确保连接成功后，再获取服务列表--可以显示正在连接效果
                },
                fail(err) {
                    reject(err)
                    console.error('蓝牙连接失败err', err)
                }
            })
        })
    }

    // 5.获取蓝牙设备的服务uuid 服务uuid可能有多个
    getServiceId(resolve, reject) {
        const that = this

        uni.getBLEDeviceServices({
            deviceId: that.bindDeviceInfo.deviceId,
            success(res) {
                // console.log('获取蓝牙四个服务', res)
                if (res.services.length) {
                    that.onNoticeConnection(); //连接成功后，开始监听连接异常
                    that.bindDeviceInfo.serviceId = res.services[0].uuid //这是用来监听蓝牙下发和接收的服务uuid
                    that.getCharacterIdNotify(resolve, reject) // 获取第xxx个服务uuid的特征值 (关于获取第几个uuid服务，看蓝牙方面提供的协议
                    clearTimeout(that.timer2);
                }
            },
            fail(err) {
                if (that.num < 10) {
                    that.connectBleDevice(that.bindDeviceInfo.deviceId).then(res => {
                        that.num = 0
                    }).catch(err => {
                        console.error(`${that.num}:次自动连接失败`, err)
                    })
                }
                that.num++
                reject(err)
            }
        })
    }

    // 根据服务uuid获取蓝牙特征值,开始监听写入和接收
    getCharacterIdNotify(resolve, reject) {
        const that = this

        uni.getBLEDeviceCharacteristics({
            deviceId: that.bindDeviceInfo.deviceId,
            serviceId: that.bindDeviceInfo.serviceId,
            success(res) {
                // console.log('获取蓝牙特征值', res)
                that.bindDeviceInfo.notifyId = res.characteristics.find(item => item.properties.notify).uuid //接收id
                that.bindDeviceInfo.writeId = res.characteristics.find(item => item.properties.write).uuid //写入id
                uni.showToast({title: '连接成功', icon: 'none', duration: 800})
                uni.$emit('connectedBluetooth', that.bindDeviceInfo)
                that.startOnNoticeBle(resolve, reject)
            },
            fail(err) {
                console.log('getBLEDeviceCharacteristics', err)
                reject(err)
            }
        })
    }

    // 开启蓝牙数据监听
    startOnNoticeBle(resolve, reject) {
        const that = this

        const {deviceId, serviceId, notifyId} = that.bindDeviceInfo
        uni.notifyBLECharacteristicValueChange({
            state: true, // 启用 notify 功能
            deviceId: deviceId,
            serviceId: serviceId,
            characteristicId: notifyId,
            success(res) {
                resolve(res, that.bindDeviceInfo)
                that.onDataDevice();
            },
            // 获取
            fail(err) {
                reject(err)
                console.error('开启监听失败', err)
            }
        })
    }

    // 接收设备返回的数据
    onDataDevice() {
        let fullData = ''; // 用来存储完整数据的字符串
        const endMarker = ''; // 假设数据以[77]结尾
        uni.onBLECharacteristicValueChange((res) => {
            const hexString = ab2hex(res.value);
            // console.log('接收设备返回的数据', hexString)
            fullData += hexString;
            // 检查是否接收到结束标志
            if (fullData.endsWith(endMarker)) {
                uni.$emit('bleVal', fullData)
                fullData = '';
            }
        })
    }

    // 向蓝牙写入数据
    writeBleInstruction(instruction) {
        // console.log('instruction', instruction)
        const that = this
        const {deviceId, serviceId, writeId} = that.bindDeviceInfo
        // 向蓝牙设备发送一个的16进制数据

        const arrayBuffer = new Uint8Array(instruction.match(/[\da-f]{2}/gi).map(ii => parseInt(ii, 16)));

        return new Promise((resolve, reject) => {
            uni.writeBLECharacteristicValue({
                deviceId: deviceId, // 蓝牙设备 deviceId
                serviceId: serviceId, // 蓝牙服务uuid,即第二个uuid
                characteristicId: writeId, // 蓝牙特征值的 (即 writeId)
                value: arrayBuffer.buffer, // 这里的value是ArrayBuffer类型
                success(res) {
                    resolve(res)
                },
                fail(err) {
                    console.error('写入数据失败', err)
                    reject(err)
                    if (err.errCode === 10006) {
                        uni.showModal({
                            content: '连接已断开',
                            showCancel: false,
                            success: function (res) {
                                if (res.confirm) {
                                    console.log('用户点击确定', deviceId);
                                    that.stopSearchBle()
                                } else if (res.cancel) {
                                    console.log('用户点击取消');
                                }
                            }
                        })
                    }
                }
            })
        })
    }

    // 断开与低功耗蓝牙设备的连接
    closeBLEConnection(deviceId, callback) {
        uni.closeBLEConnection({
            deviceId: deviceId,
            success(res) {
                if (typeof callback === 'function') {
                    callback(res)
                }
            },
        })
    }

    //关闭蓝牙模块
    closeBluetoothAdapter() {
        return new Promise((resolve, reject) => {
            uni.closeBluetoothAdapter({
                success(res) {
                    console.log("断开蓝牙")
                    resolve(res)
                },
                fail(err) {
                    reject(err)
                }
            })
        })
    }

}

//从广告数据缓冲区获取唯一ID
function getUniqueIDFromBuffer(buffer) {
    const bytes = new Uint8Array(buffer);
    return bytes.reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '');
}

// 格式化MAC地址
function formatMACAddress(macAddress) {
    if (!macAddress || typeof macAddress !== 'string') {
        return macAddress
    }
    // console.log('格式化MAC地址', macAddress.match(/.{1,2}/g).join(':'))
    return macAddress.match(/.{1,2}/g).join(':').toLocaleUpperCase();
}

// 兼容 IOS Android
function getTargetDeviceId(targetMACAddress, bluetoothDevicesFilteredList) {
    // 定义一个正则表达式来验证MAC地址
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    if (macRegex.test(targetMACAddress)) {
        let res = uni.getSystemInfoSync()
        if (res.osName === 'android') {
            let hasDev = bluetoothDevicesFilteredList.find(item => item.deviceId === targetMACAddress.trim())
            if (typeof hasDev === 'undefined') {
                console.error(targetMACAddress)
            } else {
                return targetMACAddress
            }
        } else if (res.osName === 'ios') {
            let targetDeviceInfo = bluetoothDevicesFilteredList.find(item => targetMACAddress.trim() === formatMACAddress(getUniqueIDFromBuffer(item.advertisData)))
            if (typeof targetDeviceInfo === 'undefined') {
                console.error(targetMACAddress)
            } else {
                return targetDeviceInfo.deviceId
            }
        }
    } else {

        return targetMACAddress
    }
}


// ArrayBuffer转16进度字符串示例
function ab2hex(buffer) {
    const hexArr = Array.prototype.map.call(
        new Uint8Array(buffer),
        function (bit) {
            return ('00' + bit.toString(16)).slice(-2)
        }
    )
    return hexArr.join('')
}

// 16进制转10进制整数
function hex2int(hex) {
    let len = hex.length,
        a = new Array(len),
        code;
    for (let i = 0; i < len; i++) {
        code = hex.charCodeAt(i);
        if (48 <= code && code < 58) {
            code -= 48;
        } else {
            code = (code & 0xdf) - 65 + 10;
        }
        a[i] = code;
    }

    return a.reduce(function (acc, c) {
        acc = 16 * acc + c;
        return acc;
    }, 0);
}

// #endif






