// import {YlxBluetoothManager} from "./src/bluetooth/bluetoothManage.js";

import {BluetoothManager} from "./src/bluetooth/bluetoothManage.js";


function initBluetooth(platform = uni, {advertisServiceUUIDs, localName, name, deviceId,serviceId} = {advertisServiceUUIDs: [], name: '', localName: '', deviceId: '',serviceId:''}) {

    return new BluetoothManager(platform, {advertisServiceUUIDs, name, localName, deviceId,serviceId})
}

export default initBluetooth;


