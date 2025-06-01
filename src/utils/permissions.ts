import { NativeModules, Platform, PermissionsAndroid } from 'react-native';

const { CustomIntentAndroid } = NativeModules;

export const requestStoragePermission = async () => {
  try {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 33) { // Android 13 and above
        const permissions = [
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO,
        ];

        const results = await PermissionsAndroid.requestMultiple(permissions);
        return Object.values(results).every(
          result => result === PermissionsAndroid.RESULTS.GRANTED
        );
      } else if (Platform.Version >= 30) { // Android 11 and 12
        try {
          // 打开 MANAGE_ALL_FILES_ACCESS_PERMISSION 设置页面
          await CustomIntentAndroid.openSettings(
            'android.settings.MANAGE_ALL_FILES_ACCESS_PERMISSION'
          );
          return true;
        } catch (error) {
          console.error('Error opening settings:', error);
          return false;
        }
      } else { // Android 10 and below
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: '存储权限',
            message: '应用需要访问您的存储空间以分析磁盘使用情况',
            buttonNeutral: '稍后询问',
            buttonNegative: '取消',
            buttonPositive: '确定',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    }
    return true;
  } catch (err) {
    console.error('权限请求失败:', err);
    return false;
  }
}; 