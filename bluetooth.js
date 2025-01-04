import {BluetoothManager} from "./src/bluetooth/bluetoothManage.js";


function initBluetooth( {advertisServiceUUIDs, name,serviceId} ) {

    return new BluetoothManager({advertisServiceUUIDs, name,serviceId})
}

export default initBluetooth;


