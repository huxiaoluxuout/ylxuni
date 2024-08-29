## 介绍
#### `uniapp`常用方法封装
### 如何使用
#### 复制 `dist/ylxuni.esm.js`文件到项目内

- root
    - pages
    - pages.json
    - ylxuniCore
        - useylxuni.js
        - ylxuni.esm.js

```
//useylxuni.js

import ylxIntercept from "@/ylxuniCore/ylxuni.esm.js"
export const {ylxNextPage,ylxEventBus,ylxMustLogIn} = ylxIntercept()
```
```cookie
import {ylxEventBus, ylxMustLogIn} from "@/ylxuniCore/useylxuni.js";
```
