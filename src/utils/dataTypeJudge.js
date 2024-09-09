/**
 * 判断数据类型
 * @param val
 * @param type
 * @returns {boolean|string}
 */
export function dataTypeJudge(val, type) {
    const dataType = Object.prototype.toString.call(val).replace(/\[object (\w+)\]/, "$1").toLowerCase();
    return type ? dataType === type : dataType;
}
