### `uniapp`常用方法封装  `ylxNextPage` `ylxEventBus` `ylxMustLogIn`

#### 复制 `dist/ylxuni.esm.js`文件到项目内。例如：`ylxuniCore`

- pages.json
- ylxuniCore
    - useylxuni.js
    - ylxuni.esm.js

```
// ylxuniCore/useylxuni.js
import ylxIntercept from "@/ylxuniCore/ylxuni.esm.js"
export const {ylxNextPage,ylxEventBus,ylxMustLogIn} = ylxIntercept()
```

```
import {ylxEventBus, ylxMustLogIn} from "@/ylxuniCore/useylxuni.js";
```

### `ylxEventBus`

#### `全局事件`

```
// App.vue
  import {ylxEventBus} from "@/ylxuniCore/useylxuni.js";

  onLoad() {
    ylxEventBus.onGlobal(({args, pageAlias})=>{
      console.log('ylxEventBus',args[0], pageAlias)
      /*
        args[0]
          {
          "fromPage": "/pages/index/index", //默认触发的页面的路径
          "age": 10,
          "color": "red",
          "name": "haha"
        }
        pageAlias 自定义触发页面的别名 
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
     pageAlias: '触发页面的别名'
   }, true)
}

// pagesSubMine/myOrder/myOrder.vue
  onLoad() { 
  
    ylxEventBus.on(({args, pageAlias}) => {
     
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
    ylxEventBus.on(({args, pageAlias}) => {
     
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
    <button @click="setToggle">login:{{login}}</button>

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
        login:ylxMustLogIn.loginProxyObject
      }
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
    <button @click="setToggle">login:{{login}}</button>

    <view @click="toPage1">
      <!-- toPage -->
    </view>
  </view>
</template>
<script setup>

  import {ref, reactive} from 'vue';
  
  import {ylxEventBus, ylxMustLogIn} from "@/ylxuniCore/useylxuni.js";
  
  ylxMustLogIn.setInitLogin(reactive)
  const login = ref(ylxMustLogIn.loginProxyObject)
  const instanceMyOrderHandler = ylxMustLogIn.interceptMastLogIn({onSuccess: myOrder})
  
  function setToggle() {
    ylxMustLogIn.loginProxyObject.login = !ylxMustLogIn.loginProxyObject.login
  }
  
  function myOrder() {
   
  }
  
</script>

```
