import { NativeModules } from 'react-native';

const { StorageStatsModule } = NativeModules;

export interface StorageStats {
  totalBytes: number;
  availableBytes: number;
  usedBytes: number;
  externalTotalBytes?: number;
  externalAvailableBytes?: number;
  externalUsedBytes?: number;
  volumes?: StorageVolume[];
}

export interface StorageVolume {
  description: string;
  state: string;
  primary: boolean;
  emulated: boolean;
  removable: boolean;
  path?: string;
  totalBytes?: number;
  availableBytes?: number;
  usedBytes?: number;
}

export interface AppInfo {
  packageName: string;
  appName: string;
  isSystemApp: boolean;
  appSize: number;
  dataSize: number;
  cacheSize?: number;
  totalSize?: number;
}

export default {
  /**
   * 获取存储统计信息
   * @returns 存储统计信息，包括总大小、可用大小和已使用大小
   */
  getStorageStats(): Promise<StorageStats> {
    return StorageStatsModule.getStorageStats();
  },

  /**
   * 获取已安装的应用列表及其占用空间
   * @returns 已安装应用的列表及其占用空间
   */
  getInstalledApps(): Promise<AppInfo[]> {
    return StorageStatsModule.getInstalledApps();
  }
}; 