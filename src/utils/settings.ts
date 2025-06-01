import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CacheSettings {
  enabled: boolean;
  ttl: number; // 缓存过期时间（毫秒）
}

export interface AppSettings {
  cache: CacheSettings;
}

// 默认设置
export const DEFAULT_SETTINGS: AppSettings = {
  cache: {
    enabled: true,
    ttl: 24 * 60 * 60 * 1000, // 24小时
  },
};

// 缓存时间选项
export const CACHE_TTL_OPTIONS = [
  { label: '1小时', value: 60 * 60 * 1000 },
  { label: '12小时', value: 12 * 60 * 60 * 1000 },
  { label: '1天', value: 24 * 60 * 60 * 1000 },
  { label: '1周', value: 7 * 24 * 60 * 60 * 1000 },
  { label: '1月', value: 30 * 24 * 60 * 60 * 1000 },
  { label: '永久', value: -1 },
];

const SETTINGS_STORAGE_KEY = '@app_settings';

export const loadSettings = async (): Promise<AppSettings> => {
  try {
    const savedSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
    if (savedSettings) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  return DEFAULT_SETTINGS;
};

export const saveSettings = async (settings: AppSettings): Promise<void> => {
  try {
    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}; 