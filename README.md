### `uniapp`常用方法封装  `ylxNextPage` `ylxEventBus` `ylxMustLogIn`

#### 复制 `dist/ylxuni.esm.js`文件到项目内。例如：`ylxuniCore`

- pages.json
- ylxuniCore
    - useylxuni.js
    - ylxuni.esm.js

```
// ylxuniCore/useylxuni.js
import ylxIntercept from "@/ylxuniCore/ylxuni.esm.js"
const ylxInstance = ylxIntercept()

export const ylxNextPage = ylxInstance.ylxNextPage.useNextPage
export const { ylxEventBus, ylxMustLogIn } = ylxInstance
```

```
import {ylxEventBus, ylxMustLogIn} from "@/ylxuniCore/useylxuni.js";
```

### `ylxEventBus`

#### `全局事件`

```
// App.vue
  import {ylxEventBus} from "@/ylxuniCore/useylxuni.js";
  
// ***  1. ylxEventBus.onGlobal() 
  onLoad() {
    ylxEventBus.onGlobal(({args, source})=>{
      console.log('ylxEventBus',args[0], source)
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

```
  // index.vue
  
   methods: {
     function sendGlobal() {
         ylxEventBus.emitGlobal({
          age:10,
          color:'red',
          name:'haha',
        },'触发页面的别名')
     }
   }
```

#### `页面事件`

```
// 开启页面跳转

function myOrder() {
   ylxEventBus.emit({
     targetPath: '/pagesSubMine/myOrder/myOrder',
     options:{
       age:10,
       color:'red',
       name:'haha',
       'setToggle':setToggle
     },
     source: '触发页面的别名'
   }, true)
}

// pagesSubMine/myOrder/myOrder.vue
  onLoad() { 
  
    ylxEventBus.on(({args, source}) => {
     
    })
    
  }

```

```
// 开启页面跳转，并跳转到tabbar页面

function eventBusMine() {
  ylxEventBus.emit({
  targetPath: '/pages/mine/mine',
  options: {age: 18}
  }, true, 'switchTab')
}

// pages/mine/mine

  onLoad() { 
    ylxEventBus.on(({args, source}) => {
     
    })
    
  }
```

### `ylxNextPage` 触底加载下一页和下拉刷新 `"enablePullDownRefresh": true `

```
// vue2
import {ylxNextPage} from "@/ylxuniCore/useylxuni.js";
const {mixinReachBottomPullDownRefresh, invokeAllFn, setFun, pageInfoProxy, dataHandler} = ylxNextPage()

export default {
  mixins: [mixinReachBottomPullDownRefresh],
  data() {
    return {
      incomeList: [],
    }
  },

  onLoad() {
    setFun(this.getNoticeListApi)
    invokeAllFn()

  },
  methods: {

    getNoticeListApi() {
      getNoticeList({
        page: pageInfoProxy.page,
        page_size: pageInfoProxy.pageSize
      }).then(res => {
        let resData = res.data
        let len1 = this.incomeList.length
        let len2 = resData.data.length
        let hasNextPage = resData.total > (len1 + len2)
        this.incomeList = dataHandler({data: this.incomeList, resData: resData.data}, hasNextPage)

      })
    }
  },
}
```

```
// vue3

<script setup>
  import {ref, computed, watch} from 'vue'
  import {onLoad, onReachBottom, onPullDownRefresh} from '@dcloudio/uni-app'
  import {ylxNextPage} from "@/ylxuniCore/useylxuni.js";
  
  const {setFun,invokeAllFn, pageInfoProxy, dataHandler,reload,reachBottomHandler} = ylxNextPage()
  
  const incomeList = ref([])
   getNoticeListApi() {
        getNoticeList({
          page: pageInfoProxy.page,
          page_size: pageInfoProxy.pageSize
        }).then(res => {
          let resData = res.data
          let len1 = incomeList.value.length
          let len2 = resData.data.length
          let hasNextPage = resData.total > (len1 + len2)
          incomeList.value = dataHandler({data: incomeList.value, resData: resData.data}, hasNextPage)
        })
  }
  onLoad(() => {
    setFun(getNoticeListApi)
    invokeAllFn()
  })
  onReachBottom(reachBottomHandler)
  onPullDownRefresh(reload)   

</script>

```

#### `ylxMustLogIn`

```
// vue2
<template>
  <view>
    <button @click="setToggle">hasLogin:{{hasLogin}}</button>

    <view @click="toPage1">
      <!-- toPage -->
    </view>
  </view>
</template>
<script>

import {ylxMustLogIn} from "@/ylxuniCore/useylxuni.js";
  
  export default {
    data() {
      return {
         loginProxy:ylxMustLogIn.loginProxyObject
      }
    },
    computed:{
      hasLogin() {
        return this.loginProxy.login
      },
    },
    methods: {
      setToggle() {
        ylxMustLogIn.loginProxyObject.login = !ylxMustLogIn.loginProxyObject.login
      },
      
      toPage1(){
        ylxMustLogIn.interceptMastLogIn({onSuccess:this.toPage})()
      },
  
      toPage() {
        console.log('登录后才能打印这段代码')
      },

    }
  }
</script>

```

```
// vue3
<template>
  <view>
     <button @click="setToggle">设置登录状态 hasLogin:{{ hasLogin }}</button>
  </view>
</template>
<script setup>

  import {ref, reactive} from 'vue';
  
  import {ylxEventBus, ylxMustLogIn} from "@/ylxuniCore/useylxuni.js";
  
  const loginProxy = ref(ylxMustLogIn.loginProxyObject)
  const instanceMyOrderHandler = ylxMustLogIn.interceptMastLogIn({alreadyLoggedIn: myOrder})
  const hasLogin = computed(()=>loginProxy.value.login)
  
  function setToggle() {
    ylxMustLogIn.loginProxyObject.login = !ylxMustLogIn.loginProxyObject.login
  }
  
  --------------------------------------------------------
  function setLoginToken() {
    const resData = loginRes.data
      ylxMustLogIn.setLoginToken({
        tokenKey:'token',
        tokenData:resData.token
      },()=>{
        uni.navigateBack()
    })
  }
  
  
</script>

```
```
import ylxIntercept from "./ylxuni.esm.js"

const ylxInstance = ylxIntercept(wx)

export const ylxNextPage = ylxInstance.ylxNextPage.useNextPage
export const { ylxEventBus, ylxMustLogIn } = ylxInstance

```
```
微信原生




 // 递归设置代理对象
    setWxProxyObject(targetObject, context) {
        let proxyObject = createProxyObject(targetObject, context);
        let loginProxyObject = createProxyObject(proxyObject, context);

        this.loginProxyObject=loginProxyObject

        return this.loginProxyObject;
    }
    
    function createProxyObject(targetObject, context) {
      return new Proxy(targetObject, {
          set(target, key, value) {
              target[key] = value;
              context.setData({ [key]: value });
              return true;
          }
      });
    }
    
    微信原生小程序；
    Page({
    data: {
        
        openObj: {
            age: 0,
            
        }
    },
    onLoad() {
        this.openObjProxy = setWxProxyObject(this.data.openObj, this);
    },
    setToggle() {
         // 创建并设置代理对象
         let loginProxyObject = setWxProxyObject({openObj: this.data.openObj}, this)
        let xxx = ylxMustLogIn.setWxProxyObject(loginProxyObject.openObj, this)
        xxx.age += 3
        
    }
    
});
setToggle创建并设置代理对象，如何优化代码

```
```
蓝牙

import YlxBluetoothManager from "dist/ylxuni.bluetooth.esm.js";

const instanceBluetooth = new YlxBluetoothManager()

// instanceBluetooth.
```
