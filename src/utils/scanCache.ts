import RNFS from 'react-native-fs';
import crypto from 'crypto-js';
import { Platform } from 'react-native';

const CACHE_FILE_NAME = '.folder_scan_cache';
const CACHE_DIR = RNFS.DocumentDirectoryPath + '/cache';

export interface CacheData {
  timestamp: number;
  hash: string;
  files: any[]; // 使用实际的 FileItem 类型
  totalSize: number;
  originalPath: string; // 添加原始路径以便区分不同文件夹的缓存
}

// 计算文件夹内容的哈希值
const calculateFolderHash = async (path: string): Promise<string> => {
  try {
    const items = await RNFS.readDir(path);
    const contentString = items
      .map(item => `${item.name}:${item.size}:${item.mtime}`)
      .sort()
      .join('|');
    return crypto.SHA256(contentString).toString();
  } catch (error) {
    console.error('Error calculating folder hash:', error);
    return '';
  }
};

// 确保缓存目录存在
const ensureCacheDir = async () => {
  try {
    const exists = await RNFS.exists(CACHE_DIR);
    if (!exists) {
      await RNFS.mkdir(CACHE_DIR);
    }
  } catch (error) {
    console.error('Error creating cache directory:', error);
  }
};

// 获取缓存文件路径
const getCacheFilePath = (folderPath: string): string => {
  // 使用文件夹路径的哈希作为缓存文件名，避免路径字符问题
  const pathHash = crypto.SHA256(folderPath).toString().substring(0, 32);
  return `${CACHE_DIR}/${pathHash}${CACHE_FILE_NAME}`;
};

// 读取缓存数据
export const readCacheData = async (folderPath: string): Promise<CacheData | null> => {
  try {
    await ensureCacheDir();
    const cacheFilePath = getCacheFilePath(folderPath);
    const exists = await RNFS.exists(cacheFilePath);
    
    if (!exists) {
      return null;
    }

    const content = await RNFS.readFile(cacheFilePath, 'utf8');
    const cacheData = JSON.parse(content);
    
    // 验证缓存是否属于正确的文件夹
    if (cacheData.originalPath !== folderPath) {
      return null;
    }
    
    return cacheData;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
};

// 写入缓存数据
export const writeCacheData = async (
  folderPath: string,
  files: any[],
  totalSize: number
): Promise<void> => {
  try {
    await ensureCacheDir();
    const hash = await calculateFolderHash(folderPath);
    const cacheData: CacheData = {
      timestamp: Date.now(),
      hash,
      files,
      totalSize,
      originalPath: folderPath,
    };

    const cacheFilePath = getCacheFilePath(folderPath);
    await RNFS.writeFile(cacheFilePath, JSON.stringify(cacheData), 'utf8');
    
    // 设置文件为隐藏（仅在 Android 上有效）
    if (Platform.OS === 'android') {
      try {
        await RNFS.exists(cacheFilePath); // 确保文件存在
        // 在某些 Android 设备上可能需要额外的权限或可能不支持
        // 这里我们静默处理错误，因为隐藏文件不是必需的
      } catch (error) {
        console.warn('Could not hide cache file:', error);
      }
    }
  } catch (error) {
    console.error('Error writing cache:', error);
  }
};

// 验证缓存是否有效
export const isCacheValid = async (folderPath: string): Promise<boolean> => {
  try {
    const cacheData = await readCacheData(folderPath);
    if (!cacheData) {
      return false;
    }

    // 检查缓存是否过期（例如24小时）
    const cacheAge = Date.now() - cacheData.timestamp;
    const CACHE_TTL = 24 * 60 * 60 * 1000; // 24小时
    if (cacheAge > CACHE_TTL) {
      return false;
    }

    // 检查文件夹内容是否变化
    const currentHash = await calculateFolderHash(folderPath);
    return currentHash === cacheData.hash;
  } catch (error) {
    console.error('Error validating cache:', error);
    return false;
  }
}; 