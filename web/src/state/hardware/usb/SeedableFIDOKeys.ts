import { UsbDeviceMonitor } from "./UsbDeviceMonitor";
import { action, makeAutoObservable } from "mobx";

export const isUsbDeviceASeedableFIDOKey = ({vendorId, productId}: HIDDevice): boolean =>
  (vendorId == 0x10c4 && productId == 0x8acf) ||
  (vendorId == 0x0483 && productId == 0xa2ca);

export const FiltersForUsbDeviceASeedableFIDOKey: HIDDeviceFilter[] = [
  {vendorId: 0x10c4, productId: 0x8acf},
  {vendorId: 0x0483, productId: 0xa2ca},
];

export class SeedableFIDOKeys {
  usbDeviceMonitor: UsbDeviceMonitor;
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
    this.usbDeviceMonitor = new UsbDeviceMonitor(isUsbDeviceASeedableFIDOKey)
    this.destructor = this.usbDeviceMonitor.startMonitoring(this.setDevices, this.setError);
    makeAutoObservable(this);
  }

  // private static _instance: SeedableDiceKeys | undefined;
  // static get instance() {
  //   return SeedableDiceKeys._instance ?? (SeedableDiceKeys._instance = new SeedableDiceKeys());
  // }

  destroy() {
    this.destructor?.();
  }
}
