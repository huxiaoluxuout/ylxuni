/*
let uniPlatform = ''
uni.getSystemInfo({
    success(res) {
        console.log('uni.getSystemInfo(', res)
        console.log('uni.os', res.uniPlatform)
        uniPlatform = res.uniPlatform
    },
})

if (uniPlatform === 'app') {

} else if (uniPlatform === 'mp-weixin') {

}
// #ifdef APP-PLUS
import {checkGPS, showAuthTipModal} from "./appAuthorizes";
// #endif

// #ifdef MP
import {mpCheckAuthorizes} from "./mpAuthorizes";
// #endif


// 拨打电话
const makePhoneCall = (phoneNumber, callback) => {
    uni.makePhoneCall({
        phoneNumber: '' + phoneNumber,
        fail: (fail) => {
            console.error(fail)
        },
        complete: () => {
            if (typeof callback === 'function') {
                callback()
            }
        }
    });
}

export const uniMakePhoneCall = async (phoneNumber, callback) => {
    // #ifdef WEB
    if (typeof callback === 'function') {
        callback()
    }
    // #endif

    // #ifdef MP
    makePhoneCall(phoneNumber, callback)
    // #endif

    // #ifdef APP-PLUS
    await showAuthTipModal('CALL_PHONE')
    makePhoneCall(phoneNumber, callback)
    // #endif
}

function callbackFn() {
    console.log('默认回调函数')
}


/!**
 * @param {string|number} count = 3
 * @param {Array} sizeType =['original', 'compressed']
 * @param {Array} sourceType
 * @param {function} successCallback
 * @param {function} failCallback
 * @param {function} completeCallback
 * @param {...any} otherOptions 任意数量的参数
 * @returns {Promise<unknown>}
 *!/
export const uniChooseImage = async ({
                                         count = 3,
                                         sizeType = ['original', 'compressed'],
                                         sourceType = ['album', 'camera'],
                                         success: successCallback = callbackFn,
                                         fail: failCallback = callbackFn,
                                         complete: completeCallback = callbackFn,
                                         ...otherOptions

                                     }) => {
    let isAlbum = sourceType.includes('album');
    let isCamera = sourceType.includes('camera');
    let result = true


    // #ifdef APP-PLUS
    if (isAlbum && isCamera) {
        result = await showAuthTipModal('READ_EXTERNAL_STORAGE_CAMERA')

    } else if (isCamera) {
        result = await showAuthTipModal('CAMERA')

    } else if (isAlbum) {
        result = await showAuthTipModal('READ_EXTERNAL_STORAGE')

    }
    // #endif

    return new Promise((resolve, reject) => {
        if (!result) return

        uni.chooseImage({
            count: count,
            sizeType: sizeType,
            sourceType: sourceType,
            ...otherOptions,
            success(res) {
                resolve(res);
                successCallback(res)
            },
            fail(fail) {
                console.error('chooseImage', fail)
                failCallback(fail)
                reject(fail);
            },
            complete(complete) {
                completeCallback(complete)
            }
        });

    })

}
// 获取经纬度
export const uniGetLocation = async (options = {}) => {
    let result = true

    // #ifdef MP
    result = await mpCheckAuthorizes('userLocation', '请允许授权位置，用来获取附近的理发店')
    // #endif

    // #ifdef APP-PLUS
    await checkGPS()
    result = await showAuthTipModal('ACCESS_FINE_LOCATION')
    // #endif

    return new Promise((resolve, reject) => {
        // #ifdef WEB
        resolve('web')
        // #endif
        if (!result) return

        uni.getLocation({
            type: options.type || 'gcj02', //wgs84 | gcj02
            isHighAccuracy: options.isHighAccuracy || true,
            geocode: options.geocode || false,
            success: function (res) {
                resolve(res)
            },
            fail: (fail) => {
                console.error('fail', fail);
                reject(fail)
            }
        })
    })
}

// 打开地图选择位置
export const uniChooseLocation = async (options = {}) => {
    let result = true
    // #ifdef MP
    result = await mpCheckAuthorizes('userLocation', '请允许授权位置，用来获取附近的理发店')
    // #endif

    // #ifdef APP-PLUS
    await checkGPS()

    result = await showAuthTipModal('ACCESS_FINE_LOCATION')
    // #endif

    return new Promise(resolve => {
        if (!result) return

        uni.chooseLocation({
            latitude: options.latitude || 39.909,
            longitude: options.longitude || 116.39742,
            keyword: options.keyword || '天安门',
            success: function (chooseLocationSuccess) {
                resolve(chooseLocationSuccess);
            },
            fail: function (fail) {
                console.error('fail', fail);
            }
        });
    })

}


// 使用应用内置地图查看位置 (选择要导航的App)
export const uniOpenLocation = async (options = {}) => {
    let result = true

    // #ifdef MP
    result = await mpCheckAuthorizes('userLocation', '请允许授权位置，用来导航的理发店')
    // #endif

    // #ifdef APP-PLUS
    await checkGPS()

    result = await showAuthTipModal('ACCESS_FINE_LOCATION')
    // #endif

    return new Promise(resolve => {
        if (!result) return

        uni.openLocation({
            latitude: options.latitude || 39.909,
            longitude: options.longitude || 116.39742,
            name: options.name || '天安门',
            success: function (chooseLocationSuccess) {
                resolve(chooseLocationSuccess);
            },
            fail: function (fail) {
                console.error('fail', fail);
            }
        });
    })

}


export const uniBlueTooth = async () => {
    let result = true;

    // #ifdef APP-PLUS
    result = await showAuthTipModal('BLUETOOTH')
    return new Promise(resolve => {
        if (!result) return
        setTimeout(() => {
            resolve('蓝牙授权成功');
        }, 200)
    })
    // #endif

}
*/
