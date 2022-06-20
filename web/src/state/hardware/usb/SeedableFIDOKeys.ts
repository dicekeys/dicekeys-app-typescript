import { UsbDeviceMonitor } from "./UsbDeviceMonitor";
import { action, makeAutoObservable } from "mobx";
import { RUNNING_IN_BROWSER } from "../../../utilities/is-electron";

export const isUsbDeviceASeedableFIDOKey = ({vendorId, productId}: HIDDevice): boolean =>
  (vendorId == 0x10c4 && productId == 0x8acf) ||
  (vendorId == 0x0483 && productId == 0xa2ca);

export const FiltersForUsbDeviceASeedableFIDOKey: HIDDeviceFilter[] = [
  {vendorId: 0x10c4, productId: 0x8acf},
  {vendorId: 0x0483, productId: 0xa2ca},
];

export class SeedableFIDOKeys {
  usbDeviceMonitor: UsbDeviceMonitor | undefined;
  destructor?: () => void;
  devices: HIDDevice[] = [];
  setDevices = action ((devices: HIDDevice[]) => {
    this.devices = devices
  });
  error?: any;
  setError = action ((error: any) => {
    this.error = error;
  });

  constructor() {
    if (RUNNING_IN_BROWSER) {
      return;
    }
    this.usbDeviceMonitor = new UsbDeviceMonitor(isUsbDeviceASeedableFIDOKey)
    this.destructor = this.usbDeviceMonitor.startMonitoring(this.setDevices, this.setError);
    makeAutoObservable(this);
  }

  destroy() {
    this.destructor?.();
  }
}
