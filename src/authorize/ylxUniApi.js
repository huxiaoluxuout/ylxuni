let uniPlatform = ''

const {checkGPS, showAuthTipModal} =  import('./appAuthorizes');

uni.getSystemInfo({
    success  ( res) {
        uniPlatform = res.uniPlatform
    },
})


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
    if (uniPlatform === 'web') {
        if (typeof callback === 'function') {
            callback()
        }
    } else if (uniPlatform === 'mp-weixin') {
        makePhoneCall(phoneNumber, callback)

    } else if (uniPlatform === 'app') {
        await showAuthTipModal('CALL_PHONE')

        makePhoneCall(phoneNumber, callback)
    }
}

function callbackFn() {
    console.log('默认回调函数')
}


/**
 * @param {string|number} count = 3
 * @param {Array} sizeType =['original', 'compressed']
 * @param {Array} sourceType
 * @param {function} successCallback
 * @param {function} failCallback
 * @param {function} completeCallback
 * @param {...any} otherOptions 任意数量的参数
 * @returns {Promise<unknown>}
 */
export const chooseImage = async ({
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

    if (uniPlatform === 'app') {
        if (isAlbum && isCamera) {

            result = await showAuthTipModal('READ_EXTERNAL_STORAGE_CAMERA')

        } else if (isCamera) {

            result = await showAuthTipModal('CAMERA')

        } else if (isAlbum) {

            result = await showAuthTipModal('READ_EXTERNAL_STORAGE')

        }
    }

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

/*-------------------------------------*/


/**
 * 检查平台授权
 * @param {string} message - 授权提示信息
 * @returns {Promise<boolean>} 返回是否授权成功
 */
const checkPlatformAuthorization = async (message) => {
    if (uniPlatform === 'mp-weixin') {
        const {checkWeixinAuthorization} = await import('./mpAuthorizes');
        return await checkWeixinAuthorization('userLocation', message);
    } else if (uniPlatform === 'app') {
        await checkGPS();
        return await showAuthTipModal('ACCESS_FINE_LOCATION');
    }
    return true;
};


/**
 * 获取经纬度
 * @param {Object} options - 配置选项
 * @param {string} options.type - 返回的坐标类型
 * @param {boolean} options.isHighAccuracy - 是否使用高精度
 * @param {boolean} options.geocode - 是否需要解析地址
 * @returns {Promise<Object|string>} 返回经纬度信息或平台标识
 */
export const getLocation = async (options = {}) => {
    const isAuthorized = await checkPlatformAuthorization('请允许授权位置，用来获取附近的理发店');

    return new Promise((resolve, reject) => {
        if (uniPlatform === 'web') {
            resolve('web');
        }

        if (!isAuthorized) return;
        uni.getLocation({
            type: options.type || 'gcj02', // wgs84 | gcj02
            isHighAccuracy: options.isHighAccuracy !== undefined ? options.isHighAccuracy : true,
            geocode: options.geocode !== undefined ? options.geocode : false,
            success: (res) => resolve(res),
            fail: (error) => {
                console.error('Failed to get location', error);
                reject(error);
            }
        });
    });
};

/**
 * 打开地图选择位置
 * @param {Object} options - 配置选项
 * @param {number} options.latitude - 纬度
 * @param {number} options.longitude - 经度
 * @param {string} options.keyword - 关键字
 * @returns {Promise<Object>} 返回选择位置信息
 */
export const chooseLocation = async (options = {}) => {
    const isAuthorized = await checkPlatformAuthorization('请允许授权位置，用来获取附近的理发店');

    return new Promise((resolve, reject) => {
        if (!isAuthorized) return;

        uni.chooseLocation({
            latitude: options.latitude || 39.909,
            longitude: options.longitude || 116.39742,
            keyword: options.keyword || '天安门',
            success: (location) => resolve(location),
            fail: (error) => {
                console.error('Failed to choose location', error);
                reject(error);
            }
        });
    });
};

/**
 * 使用应用内置地图查看位置
 * @param {Object} options - 配置选项
 * @param {number} options.latitude - 纬度
 * @param {number} options.longitude - 经度
 * @param {string} options.name - 位置名称
 * @returns {Promise<Object>} 返回打开位置信息
 */
export const openLocation = async (options = {}) => {
    const isAuthorized = await checkPlatformAuthorization('请允许授权位置，用来导航的理发店');

    return new Promise((resolve, reject) => {
        if (!isAuthorized) return;

        uni.openLocation({
            latitude: options.latitude || 39.909,
            longitude: options.longitude || 116.39742,
            name: options.name || '天安门',
            success: (location) => resolve(location),
            fail: (error) => {
                console.error('Failed to open location', error);
                reject(error);
            }
        });
    });
};


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
