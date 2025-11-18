
## NodeJs 18.12.0
### `uniapp`常用方法封装  `ylxNextPage` `ylxEventBus` `ylxIntercept`

#### 复制 `dist/ylxuni.esm.js`文件到项目内。例如：`ylxuniCore`

- pages.json
- ylxuniCore
    - useylxuni.js
    - ylxuni.esm.js
    - ylxuni_wx.cjs.js（微信原生小程序）

---
### vue3 - `useylxuni.js`

```
import {reactive} from 'vue'
import ylxuni from "@/ylxuniCore/ylxuni.esm.js"
const ylxInstance = ylxuni(uni,reactive)
export const { ylxEventBus, ylxIntercept ,ylxNextPage} = ylxInstance
export const InterceptKeys ={
    login: false,// 登录
    isVip: false,// 会员
}
ylxIntercept.initIntercepts(InterceptKeys)

```

### vue2 - `useylxuni.js`
```
import ylxuni from "@/ylxuniCore/ylxuni.esm.js"
const ylxInstance = ylxuni(uni)

export const { ylxEventBus, ylxIntercept ,ylxNextPage} = ylxInstance
```

### 微信原生小程序 -  `useylxuni.js`
```
const ylxuni =require("./ylxuni_wx.cjs")
const ylxInstance = ylxuni(wx)

export const { ylxEventBus,ylxNextPage} = ylxInstance

```

---

### `ylxEventBus`

#### `全局事件-注册事件` - `App.vue`

```
  import {ylxEventBus} from "@/ylxuniCore/useylxuni.js";
  
// ***  1. ylxEventBus.onGlobal() 
  onLoad() {
    ylxEventBus.onGlobal(({args, source})=>{
      console.log('ylxEventBus',args[0], source)
      args[0].thenCallback('哈哈哈哈')
      /*
        args[0]
          {
          "fromPage": "/pages/index/index", //默认触发的页面的路径
          "age": 10,
          "color": "red",
          "name": "haha"
        }
        source 自定义触发页面别名 
      */
    })
  }
```
#### `全局事件-发送消息` - `index.vue`
```
   methods: {
     function sendGlobal() {
         ylxEventBus.emitGlobal({
          age:10,
          color:'red',
          name:'haha',
        },'触发页面的别名') // ***别名的位置和全局事件不一样
            .then(res=>{
                // 由onGlobal触发 args[0].thenCallback('哈哈')
                 console.log('哈哈')
             }) 
     }
   }
```

#### `页面事件-注册` - `pagesSubMine/myOrder/myOrder.vue`
```
  onLoad() { 
 
    ylxEventBus.on(({args, source}) => {
        args[0].thenCallback('嘻嘻')
    })
    
  }
```
#### `页面事件-发送消息` - `pagesSubMine/myOrder/myOrder.vue`

```
function myOrder() {
   ylxEventBus.emit({
     targetPath: '/pagesSubMine/myOrder/myOrder',
     //prevPage:true,//上一页
     options:{
       age:10,
       color:'red',
       name:'haha',
       'setToggle':setToggle
     },
     source: '触发页面的别名' // ***别名的位置和页面事件不一样
   }).then(res=>{
                // 由onGlobal触发 args[0].thenCallback('嘻嘻')
                 console.log('嘻嘻')
    }) 
}

```
#### `页面事件-发送消息-` - `并跳转到tabbar页面`

```
function eventBusMine() {
  ylxEventBus.emit({
  targetPath: '/pages/mine/mine',
  //prevPage:true,//上一页
  options: {age: 18}
  })
}

```

#### `微信原生小程序 全局事件-注册事件` - `app.js`

```
onLaunch: function () {
  ylxEventBus.onGlobal(({args, source,},) => {
      console.log('ylxEventBus', args[0])
      args[0].thenCallback('app.js')
  })
}

```
#### `微信原生小程序 全局事件-发送消息` - `index.js`

```
//使用 ylxEventBus.emitGlobal
onLoad: function () {
   ylxEventBus.emitGlobal({
          age:10,
          color:'red',
          name:'haha',
      },'优惠券').then(res=>{
          console.log('emitGlobal',res)
      })
}
```

---

### `ylxNextPage` 
#### 触底加载下一页和下拉刷新 ` "enablePullDownRefresh": true `

#### vue2 -`ylxNextPage`- `index.vue`

```
import {ylxNextPage} from "@/ylxuniCore/useylxuni.js";

const {ylxMixins,ylxPageInfo, ylxReachBottom, ylxSetFn, ylxAddFn, ylxInvokeFn, ylxRefresh, ylxSetData} = ylxNextPage.useNextPage({page: 1, pageSize: 10})


export default {
  mixins: [ylxMixins],
  data() {
    return {
      incomeList: [],
    }
  },

  onLoad() {
    ylxSetFn(this.getNoticeListApi)
    ylxInvokeFn()

  },
  methods: {

    getNoticeListApi() {
      getNoticeList({
        page: ylxPageInfo.page,
        page_size: ylxPageInfo.pageSize
      }).then(res => {
        let resData = res.data
        this.incomeList = ylxSetData({data: this.incomeList, resData: resData.data}, resData.total)
      })
    }
  },
}
```

#### vue3  -`ylxNextPage`- `index.vue`
```
<script setup>
  import {ref, computed, watch} from 'vue'
  import {onLoad, onReachBottom, onPullDownRefresh} from '@dcloudio/uni-app'
  import {ylxNextPage} from "@/ylxuniCore/useylxuni.js";
  
  const {ylxPageInfo, ylxReachBottom, ylxSetFn, ylxAddFn, ylxInvokeFn, ylxRefresh, ylxSetData} = ylxNextPage.useNextPage({page: 1, pageSize: 10})

  const incomeList = ref([])
   getNoticeListApi() {
        getNoticeList({
          page: ylxPageInfo.page,
          page_size: ylxPageInfo.pageSize
        }).then(res => {
          let resData = res.data
          incomeList.value = ylxSetData({data: incomeList.value, resData: resData.list},  resData.total)
        })
  }
  onLoad(() => {
    /*------------------------------------------*/
    ylxSetFn(getNoticeListApi)
    // 在合适的时机调用
    ylxInvokeFn()
  })
  onReachBottom(ylxReachBottom)
  onPullDownRefresh(ylxRefresh)   

</script>

```

#### 微信原生小程序  -`ylxNextPage`- `index.js`

```
import {ylxNextPage} from "../../../ylxuniCore/useylxuni";

const app = getApp();

Page({

    data: {
        couponList: [],
    },
    onLoad(options) {
        const {ylxPageInfo, ylxReachBottom, ylxSetFn, ylxAddFn, ylxInvokeFn, ylxRefresh, ylxSetData} = ylxNextPage.useNextPage({page: 1, pageSize: 10})
        this.ylxPageInfo = ylxPageInfo;
        this.ylxReachBottom = ylxReachBottom;
        this.ylxSetFn = ylxSetFn;
        this.ylxAddFn = ylxAddFn;
        this.ylxInvokeFn = ylxInvokeFn;
        this.ylxRefresh = ylxRefresh;
        this.ylxSetData = ylxSetData;
        /*------------------------------------------*/
        this.ylxSetFn(this.getList)
        // 在合适的时机调用
        this.ylxInvokeFn()
        
    },

    // 其他优惠券
    getList() {
        apiGetList({
            page: this.ylxPageInfo.page,
            page_size: this.ylxPageInfo.pageSize
        }).then((res) => {
            let resData = res.data
       
            this.setData({
                couponList:  this.ylxSetData({data: this.data.couponList, resData: resData.data},  resData.total)
            })
            
        });
    },
    // 切换
    onChange(event) {
        this.setData({active: event.detail.name});
        // 重置列表数据
        this.ylxRefresh()
    },
    onPullDownRefresh() {
        // 重置列表数据
        this.ylxRefresh()
    },

    onReachBottom() {
        this.ylxReachBottom()
    },

})

```
---
### `ylxIntercept`

#### vue2 -`ylxIntercept`- `index.vue`

```
<template>
  <view>
    <button @click="setToggle">hasLogin:{{hasLogin}}</button>

    <view @click="toPage1">
      <!-- toPage -->
    </view>
  </view>
</template>
<script>

import {ylxIntercept} from "@/ylxuniCore/useylxuni.js";
  
  export default {
    data() {
      return {
         loginProxy:ylxIntercept.getIntercepts
      }
    },
    computed:{
      hasLogin() {
        return this.loginProxy.login
      },
    },
    methods: {
      setToggle() {
        ylxIntercept.setIntercept('login', !ylxIntercept.getInterceptState('login'))
      },
      
      toPage1(){
        ylxIntercept.intercept({success:this.toPage})()
      },
  
      toPage() {
        console.log('登录后才能打印这段代码')
      },

    }
  }
</script>

```
#### vue3 - `ylxIntercept`- `index.vue`

```
<template>
  <view>
     <button @click="setToggle">设置登录状态 hasLogin:{{ hasLogin }}</button>
  </view>
</template>
<script setup>

  import {ref, reactive} from 'vue';
  
  import {ylxEventBus, ylxIntercept} from "@/ylxuniCore/useylxuni.js";
  
  const instanceMyOrderHandler = ylxIntercept.intercept({success: myOrder})
  const hasLogin = computed(() => ylxIntercept.getIntercepts.login)

  
  function setToggle() {
    ylxIntercept.setIntercept('login', !ylxIntercept.getInterceptState('login'))
  }
  function interceptToPage(fn,...args) {
    ylxIntercept.intercept({
      success: ()=>fn(...args),
      fail:  ()=>ylxNavigateTo('/pages/login/login')
    })()
  }
  --------------------------------------------------------
  function setLoginToken() {
    const resData = loginRes.data
    ylxIntercept.setIntercept('login',true)
    uni.navigateBack()
  }
  // 退出
  function signOut() {
      ylxIntercept.setIntercept('login',false)
  }
</script>

```
####  微信原生小程序 `ylxIntercept`

```
    myOrder() {
        console.log('登录后才打印。。。。。。')
    },
    instanceMyOrderHandler() {
        ylxIntercept.intercept({success: this.myOrder})()
    },
    setToggle() {
        ylxIntercept.setIntercept('login', !ylxIntercept.getInterceptState('login'))
        this.setData({
            hasLogin: ylxIntercept.getIntercepts.login,
        })
    }
```
---
#### `蓝牙`
```

import YlxBluetoothManager from "dist/ylxuni.bluetooth.esm.js";

const instanceBluetooth = new YlxBluetoothManager()

// instanceBluetooth.
```
