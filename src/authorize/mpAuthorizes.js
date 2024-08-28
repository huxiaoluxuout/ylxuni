/**
 * https://uniapp.dcloud.net.cn/api/other/authorize.html#scope-%E5%88%97%E8%A1%A8
 * */

export const mpCheckAuthorizes = (scope, rejectionTips) => {
    const scopes = {
        'userInfo': 'scope.userInfo', // 用户信息
        'userLocation': 'scope.userLocation', //地理位置
        'userLocationBackground': 'scope.userLocationBackground', //后台定位
        'address': 'scope.address', // 通信地址
        'record': 'scope.record', // 录音功能
        'camera': 'scope.camera',// 摄像头
        'writePhotosAlbum': 'scope.writePhotosAlbum',// 保存到相册
        'album': 'scope.album',// 保存到相册(抖音小程序)
        'bluetooth': 'scope.bluetooth',// 蓝牙
    }

    return new Promise((resolve, reject) => {

        uni.getSetting({
            success(res) {
                // 小程序底部未弹出申请使权限
                if (!res.authSetting.hasOwnProperty(scopes[scope])) {
                    uni.authorize({
                        scope: scopes[scope],
                        success(res) {
                            console.log('触发弹出申请使用', res)
                            resolve(1)
                        },
                        fail() {
                            openSetting(rejectionTips)
                        },
                    })

                } else {
                    if (res.authSetting[scopes[scope]]) {
                        resolve(1)
                    } else {
                        openSetting(rejectionTips)
                        reject(0)
                    }
                }
            },

            fail(fail) {
                reject(fail)
            }
        })
    })
}

function openSetting(rejectionTips) {
    uni.showModal({
        title: rejectionTips,
        showCancel: true,
        success: function (res) {
            if (res.confirm) {
                uni.openSetting({
                    success(res) {
                        console.log(res.authSetting)
                    }
                });
            }
        }
    });
}

const promiseCallback = (promiseFn, ...args) => {
    return {
        onSuccess: (callback) => {
            promiseFn(...args).then(res => {
                callback(res);
            });
        },
        onError: (callback) => {
            promiseFn(...args).catch(err => {
                callback(err);
            });
        }
    };
}

export function BluetoothAuthorize(leadText = '请允许小程序使用蓝牙') {
    return promiseCallback(mpCheckAuthorizes, 'bluetooth', leadText)
}
