/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useState, useEffect, useRef} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  PermissionsAndroid,
  Platform,
  Alert,
  Linking,
  NativeModules,
  Switch,
  StatusBar,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import RNFS from 'react-native-fs';
import { requestStoragePermission } from './src/utils/permissions';
import { ProgressBar } from '@react-native-community/progress-bar-android';
import { translations } from './src/i18n/translations';
import { readCacheData, writeCacheData, isCacheValid } from './src/utils/scanCache';
import { SettingsModal } from './src/components/SettingsModal';
import { AppSettings, DEFAULT_SETTINGS, loadSettings, saveSettings } from './src/utils/settings';
import { colors } from './src/theme/colors';
import { TechButton } from './src/components/TechButton';
import { TechCard } from './src/components/TechCard';
import { TechHeader } from './src/components/TechHeader';
import { TechFileItem } from './src/components/TechFileItem';
import { FileBrowserModal } from './src/components/FileBrowserModal';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { StorageStatsView } from './src/components/StorageStatsView';

interface FileItem {
  name: string;
  path: string;
  size: number;
  isDirectory: boolean;
  children?: FileItem[];
}

// 科技风背景组件
const TechBackground = () => {
  const gridOpacity = useRef(new Animated.Value(0)).current;
  const [gridLines, setGridLines] = useState<{ x: number, y: number, opacity: number }[]>([]);
  
  useEffect(() => {
    // 生成网格线
    const { width, height } = Dimensions.get('window');
    const lines: { x: number, y: number, opacity: number }[] = [];
    
    // 水平线
    for (let y = 0; y < height; y += 50) {
      lines.push({ 
        x: 0, 
        y, 
        opacity: Math.random() * 0.1 + 0.05 
      });
    }
    
    // 垂直线
    for (let x = 0; x < width; x += 50) {
      lines.push({ 
        x, 
        y: 0, 
        opacity: Math.random() * 0.1 + 0.05 
      });
    }
    
    setGridLines(lines);
    
    // 淡入动画
    Animated.timing(gridOpacity, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();
    
    // 脉冲动画
    const pulseAnimation = () => {
      Animated.sequence([
        Animated.timing(gridOpacity, {
          toValue: 0.7,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(gridOpacity, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        })
      ]).start(() => pulseAnimation());
    };
    
    pulseAnimation();
  }, []);
  
  return (
    <Animated.View style={[styles.techBackground, { opacity: gridOpacity }]}>
      {gridLines.map((line, index) => (
        <View 
          key={`grid-line-${index}`}
          style={[
            styles.gridLine,
            {
              left: line.x,
              top: line.y,
              right: line.x ? 0 : undefined,
              bottom: line.y ? 0 : undefined,
              width: line.x ? 1 : '100%',
              height: line.y ? 1 : '100%',
              opacity: line.opacity,
            }
          ]}
        />
      ))}
    </Animated.View>
  );
};

function App(): JSX.Element {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [scanning, setScanning] = useState(false);
  const [currentPath, setCurrentPath] = useState<string>(RNFS.ExternalStorageDirectoryPath);
  const [progress, setProgress] = useState(0);
  const [hasPermission, setHasPermission] = useState(false);
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  const [isFileBrowserVisible, setIsFileBrowserVisible] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [totalSize, setTotalSize] = useState(0);
  const [fileCount, setFileCount] = useState(0);
  const scanLineAnimation = useRef(new Animated.Value(0)).current;
  const pathScaleAnimation = useRef(new Animated.Value(1)).current;
  const [activeView, setActiveView] = useState<'fileExplorer' | 'storageStats'>('fileExplorer');

  const t = translations[language];

  // 加载设置
  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);

  // 保存设置
  const handleSettingsChange = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const openAllFilesAccessSettings = async () => {
    try {
      if (Platform.OS === 'android' && typeof Platform.Version === 'number' && Platform.Version >= 30) {
        // Android 11 及以上版本
        try {
          // 尝试直接打开"所有文件访问权限"设置页面
          await Linking.openSettings();
        } catch (error) {
          console.warn('Failed to open settings directly:', error);
          // 如果直接打开失败，尝试使用 ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION
          try {
            const settingsIntent = 'android.settings.MANAGE_ALL_FILES_ACCESS_PERMISSION';
            await NativeModules.CustomIntentAndroid.openSettings(settingsIntent);
          } catch (intentError) {
            console.warn('Failed to open with intent:', intentError);
            // 如果都失败了，打开应用设置页面
            await Linking.openSettings();
          }
        }
      } else {
        // Android 10 及以下版本
        await Linking.openSettings();
      }
    } catch (error) {
      console.warn('Error opening settings:', error);
      Alert.alert(
        '打开设置失败',
        '请手动前往系统设置 > 应用 > MyApp > 权限，开启存储权限。',
        [{text: '确定', style: 'default'}],
      );
    }
  };

  const requestAllFilesAccess = async () => {
    try {
      Alert.alert(
        '需要完整文件访问权限',
        '请在接下来的系统设置中开启"允许访问所有文件"的权限，否则无法完整分析存储空间。',
        [
          {
            text: '去设置',
            onPress: openAllFilesAccessSettings,
          },
          {
            text: '取消',
            style: 'cancel',
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.warn('Request all files access error:', error);
    }
  };

  const showSettingsDialog = () => {
    Alert.alert(
      '需要存储权限',
      '请在设置中开启所有必要的存储权限，以便分析磁盘空间',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '去设置',
          onPress: openAllFilesAccessSettings,
        },
      ],
      {cancelable: false},
    );
  };

  // 检查是否已经获取了所有文件访问权限
  const checkAllFilesAccessPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        // 尝试访问一个需要特殊权限的目录
        const testPath = '/storage/emulated/0/Android/data';
        try {
          const result = await RNFS.exists(testPath);
          console.log('Permission check result:', result, 'for path:', testPath);
          
          if (result) {
            try {
              // 进一步验证是否真的可以读取目录
              const items = await RNFS.readDir(testPath);
              if (items && items.length >= 0) {
                console.log('Can read directory, items count:', items.length);
                setHasPermission(true);
              } else {
                console.log('Directory exists but cannot read items');
                const granted = await requestStoragePermission();
                setHasPermission(granted);
              }
            } catch (readError) {
              console.log('Cannot read directory:', readError);
              const granted = await requestStoragePermission();
              setHasPermission(granted);
            }
          } else {
            const granted = await requestStoragePermission();
            setHasPermission(granted);
          }
        } catch (existsError) {
          console.log('Error checking if path exists:', existsError);
          const granted = await requestStoragePermission();
          setHasPermission(granted);
        }
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
      const granted = await requestStoragePermission();
      setHasPermission(granted);
    }
  };

  useEffect(() => {
    checkAllFilesAccessPermission();

    const unsubscribe = Linking.addEventListener('url', () => {
      checkAllFilesAccessPermission();
    });

    return () => {
      if (unsubscribe) {
        unsubscribe.remove();
      }
    };
  }, []);

  useEffect(() => {
    // Apply status bar configuration
    StatusBar.setBarStyle('light-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setTranslucent(true);
    }
  }, []);

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const scanDirectory = async (path: string): Promise<FileItem[]> => {
    try {
      console.log('Scanning directory:', path);
      
      // Check if path is null or undefined
      if (!path) {
        console.log('Path is null or undefined');
        return [];
      }
      
      const exists = await RNFS.exists(path);
      if (!exists) {
        console.log('Path does not exist:', path);
        return [];
      }

      // 只在启用缓存时检查缓存
      if (settings.cache.enabled) {
        const hasCacheValid = await isCacheValid(path);
        if (hasCacheValid) {
          console.log('Using cached data for:', path);
          const cacheData = await readCacheData(path);
          if (cacheData) {
            return cacheData.files;
          }
        }
      }

      console.log('Scanning directory (no valid cache):', path);

      // 检查路径是否可访问
      let items;
      try {
        items = await RNFS.readDir(path);
      } catch (error) {
        console.log('Cannot access path:', path, error);
        return [];
      }

      if (!items || items.length === 0) {
        console.log('Directory is empty or items is null:', path);
        return [];
      }

      const results: FileItem[] = [];
      
      for (const item of items) {
        try {
          // 跳过缓存文件
          if (!item || !item.name || item.name === '.folder_scan_cache') {
            continue;
          }

          console.log('Processing item:', item.path);
          
          const fileItem: FileItem = {
            name: item.name,
            path: item.path,
            size: 0,
            isDirectory: item.isDirectory(),
          };

          if (item.isDirectory()) {
            try {
              fileItem.children = await scanDirectory(item.path);
              fileItem.size = fileItem.children.reduce((acc, child) => acc + child.size, 0);
            } catch (dirError) {
              console.log('Error scanning subdirectory:', item.path, dirError);
              fileItem.children = [];
              fileItem.size = 0;
            }
          } else {
            try {
              const stat = await RNFS.stat(item.path);
              fileItem.size = stat.size;
            } catch (statError) {
              console.log('Error getting file size:', item.path, statError);
              fileItem.size = 0;
            }
          }

          results.push(fileItem);
        } catch (itemError) {
          console.log('Error processing item:', itemError);
        }
      }

      // 按大小排序前检查数组是否为空
      if (results.length > 0) {
        const sortedResults = results.sort((a, b) => b.size - a.size);
        
        // 写入缓存
        const totalSize = results.reduce((acc, item) => acc + item.size, 0);
        await writeCacheData(path, sortedResults, totalSize);
        
        return sortedResults;
      }
      return [];
    } catch (error) {
      console.warn('Error scanning directory:', path, error);
      return [];
    }
  };

  const startScan = async () => {
    if (!hasPermission) {
      requestAllFilesAccess(); // Show the dialog to request all files access permission
      return;
    }
    
    try {
      setScanning(true);
      setProgress(0);
      
      // 使用 Set 来去重路径
      const uniquePaths = new Set([
        RNFS.ExternalStorageDirectoryPath,
        RNFS.ExternalDirectoryPath,
        RNFS.DocumentDirectoryPath,
        '/storage/emulated/0',
        '/storage/emulated/0/Download',
        '/storage/emulated/0/DCIM',
        '/storage/emulated/0/Pictures',
        '/storage/emulated/0/Movies',
        '/storage/emulated/0/Music',
        '/storage/emulated/0/Documents',
        '/storage/emulated/0/Podcasts',
        '/storage/emulated/0/Alarms',
        '/storage/emulated/0/Notifications',
        '/storage/emulated/0/Ringtones',
      ]);

      // 添加当前路径
      uniquePaths.add(currentPath);

      console.log('Available paths:', Array.from(uniquePaths));
      
      let results: FileItem[] = [];
      const processedPaths = new Set<string>(); // 用于跟踪已处理的路径

      // 尝试扫描Android/data目录（如果有权限）
      try {
        const androidDataPath = '/storage/emulated/0/Android/data';
        console.log('Trying to scan Android/data directory');
        
        const exists = await RNFS.exists(androidDataPath);
        if (exists) {
          try {
            const items = await RNFS.readDir(androidDataPath);
            if (items && items.length >= 0) {
              console.log('Successfully read Android/data directory, found items:', items.length);
              
              // 如果能读取，说明有权限，继续扫描
              const androidDataResults = await scanDirectory(androidDataPath);
              if (androidDataResults && androidDataResults.length > 0) {
                results = [...results, ...androidDataResults];
                processedPaths.add(androidDataPath);
                console.log('Successfully scanned Android/data directory');
              }
            } else {
              console.warn('Android/data directory exists but items is null or empty');
            }
          } catch (error) {
            console.warn('Cannot access Android/data directory:', error);
            // 显示权限请求对话框
            if (!hasPermission) {
              requestAllFilesAccess();
            }
          }
        }
      } catch (error) {
        console.warn('Error checking Android/data directory:', error);
      }

      // 继续扫描其他路径，即使Android/data失败
      for (const path of uniquePaths) {
        try {
          if (processedPaths.has(path)) {
            continue; // 跳过已处理的路径
          }

          console.log('Trying to scan path:', path);
          const exists = await RNFS.exists(path);
          console.log('Path exists:', path, exists);
          
          if (exists) {
            const pathResults = await scanDirectory(path);
            if (pathResults && pathResults.length > 0) {
              console.log('Scan results for path:', path, pathResults.length);
              results = [...results, ...pathResults];
              processedPaths.add(path);
            }
          }
        } catch (error) {
          console.warn('Error scanning path:', path, error);
        }
      }
      
      if (results.length === 0) {
        console.log('No files found in any path');
        Alert.alert(
          '扫描结果为空',
          '未能读取到任何文件，请确保已授予所有必要的权限。\n\n如果这是模拟器环境，可能没有真实的文件数据。',
          [
            {
              text: '请求权限',
              onPress: () => requestAllFilesAccess(),
            },
            {
              text: '确定',
              style: 'cancel',
            },
          ],
        );
      } else {
        console.log('Total files found:', results.length);
        // 计算总大小和文件数量
        let totalBytes = 0;
        let totalFiles = 0;
        
        const countFilesRecursive = (items: FileItem[]) => {
          if (!items) return;
          for (const item of items) {
            if (item.isDirectory && item.children) {
              countFilesRecursive(item.children);
            } else if (!item.isDirectory) {
              totalFiles++;
            }
            totalBytes += item.size;
          }
        };
        
        countFilesRecursive(results);
        setTotalSize(totalBytes);
        setFileCount(totalFiles);
      }

      setFiles(results);
      setScanning(false);
      setProgress(1);
    } catch (error) {
      console.error('Scanning error:', error);
      Alert.alert(
        t.scanError,
        t.scanErrorDesc,
        [
          {
            text: t.retry,
            onPress: () => requestAllFilesAccess(),
          },
          {
            text: t.ok,
            style: 'cancel',
          },
        ],
      );
      setScanning(false);
      setProgress(0);
    }
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const renderTechFileItem = (item: FileItem, level: number = 0, index: number) => {
    const totalSize = files.reduce((acc, file) => acc + file.size, 0);
    const percentage = totalSize > 0 ? (item.size / totalSize) * 100 : 0;
    const isExpanded = expandedFolders.has(item.path);
    const uniqueKey = `${item.path}-${index}`;

    return (
      <View key={uniqueKey}>
        <TechFileItem
          name={item.name}
          path={item.path}
          size={item.size}
          isDirectory={item.isDirectory}
          percentage={percentage}
          level={level}
          isExpanded={isExpanded}
          onPress={() => {
            if (item.isDirectory) {
              toggleFolder(item.path);
            }
          }}
        />
        
        {item.isDirectory && isExpanded && item.children?.map((child, childIndex) => 
          renderTechFileItem(child, level + 1, childIndex)
        )}
      </View>
    );
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'zh' ? 'en' : 'zh');
  };

  // 添加路径卡片动画效果
  const animatePathCard = () => {
    // 重置动画值
    scanLineAnimation.setValue(0);
    
    // 先缩小再放大的效果
    Animated.sequence([
      Animated.timing(pathScaleAnimation, {
        toValue: 0.98,
        duration: 150,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(pathScaleAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.elastic(1.2),
      }),
    ]).start();
    
    // 扫描线动画
    Animated.timing(scanLineAnimation, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
  };

  return (
    <LinearGradient 
      colors={[colors.background.dark, colors.background.main]} 
      style={styles.container}>
      <StatusBar 
        barStyle="light-content"
        backgroundColor="transparent"
        translucent 
      />
      
      <TechBackground />
      
      <TechHeader
        title={activeView === 'fileExplorer' ? t.currentPath : t.storageOverview}
        subtitle={activeView === 'fileExplorer' ? currentPath : ''}
        rightIcon={
          <Icon name="cog" size={24} color={colors.text.primary} />
        }
        onRightPress={() => setIsSettingsVisible(true)}
      />
      
      {activeView === 'fileExplorer' ? (
        <>
          <View style={styles.pathInputSection}>
            <TechCard
              onPress={() => {
                setIsFileBrowserVisible(true);
                animatePathCard();
              }}
              hoverable
              style={styles.pathDisplay}>
              <Animated.View 
                style={[
                  styles.pathDisplayContent, 
                  { transform: [{ scale: pathScaleAnimation }] }
                ]}>
                <Icon name="folder-open" size={22} color="#FFD54F" style={styles.pathIcon} />
                <Text style={styles.pathText} numberOfLines={1} ellipsizeMode="middle">
                  {currentPath}
                </Text>

                {/* 扫描线动画效果 */}
                <Animated.View 
                  style={[
                    styles.scanLine,
                    {
                      transform: [
                        { 
                          translateX: scanLineAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-50, 350]
                          })
                        }
                      ],
                      opacity: scanLineAnimation.interpolate({
                        inputRange: [0, 0.2, 0.8, 1],
                        outputRange: [0, 1, 1, 0]
                      })
                    }
                  ]}
                />
              </Animated.View>
            </TechCard>
            
            <View style={styles.languageContainer}>
              <Text style={styles.languageText}>中文</Text>
              <Switch
                value={language === 'en'}
                onValueChange={toggleLanguage}
                style={styles.languageSwitch}
                trackColor={{false: colors.background.light, true: colors.primary}}
                thumbColor={language === 'en' ? colors.primaryLight : colors.text.primary}
              />
              <Text style={styles.languageText}>English</Text>
            </View>
          </View>

          <TechButton
            title={scanning ? t.scanning : t.scan}
            onPress={startScan}
            disabled={scanning}
            loading={scanning}
            icon={<Icon name="folder-search" size={20} color={colors.text.primary} />}
            style={styles.scanButton}
          />

          {scanning && (
            <View style={styles.progressBarWrapper}>
              <View style={styles.progressBar}>
                <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
              </View>
            </View>
          )}
          
          {files.length > 0 && !scanning && (
            <View style={styles.statsContainer}>
              <TechCard style={styles.statCard}>
                <View style={styles.statContent}>
                  <Icon name="file-multiple" size={24} color={colors.primary} />
                  <View style={styles.statTextContainer}>
                    <Text style={styles.statValue}>{fileCount}</Text>
                    <Text style={styles.statLabel}>{t.files}</Text>
                  </View>
                </View>
              </TechCard>
              
              <TechCard style={styles.statCard}>
                <View style={styles.statContent}>
                  <Icon name="harddisk" size={24} color={colors.secondary} />
                  <View style={styles.statTextContainer}>
                    <Text style={styles.statValue}>{formatSize(totalSize)}</Text>
                    <Text style={styles.statLabel}>{t.totalSize}</Text>
                  </View>
                </View>
              </TechCard>
            </View>
          )}

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {files.length === 0 && !scanning ? (
              <TechCard style={styles.emptyCard}>
                <Text style={styles.emptyText}>{t.noFiles}</Text>
              </TechCard>
            ) : (
              files.map((item, index) => renderTechFileItem(item, 0, index))
            )}
          </ScrollView>
        </>
      ) : (
        <StorageStatsView translations={t} />
      )}

      {/* 底部导航栏 */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navItem, activeView === 'fileExplorer' && styles.activeNavItem]}
          onPress={() => setActiveView('fileExplorer')}>
          <Icon
            name="folder-open"
            size={24}
            color={activeView === 'fileExplorer' ? colors.primary : colors.text.secondary}
          />
          <Text
            style={[
              styles.navText,
              activeView === 'fileExplorer' && styles.activeNavText,
            ]}>
            {t.fileExplorer}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navItem, activeView === 'storageStats' && styles.activeNavItem]}
          onPress={() => setActiveView('storageStats')}>
          <Icon
            name="chart-pie"
            size={24}
            color={activeView === 'storageStats' ? colors.primary : colors.text.secondary}
          />
          <Text
            style={[
              styles.navText,
              activeView === 'storageStats' && styles.activeNavText,
            ]}>
            {t.storageStats}
          </Text>
        </TouchableOpacity>
      </View>

      <FileBrowserModal 
        visible={isFileBrowserVisible}
        onClose={() => setIsFileBrowserVisible(false)}
        onSelectPath={(path) => {
          setCurrentPath(path);
          setIsFileBrowserVisible(false);
        }}
        initialPath={currentPath}
        translations={t}
      />

      <SettingsModal
        visible={isSettingsVisible}
        onClose={() => setIsSettingsVisible(false)}
        settings={settings}
        onSettingsChange={handleSettingsChange}
        translations={t}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pathInputSection: {
    padding: 16,
  },
  pathInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pathInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    color: colors.text.primary,
    backgroundColor: colors.background.light,
  },
  pathButton: {
    width: 60,
  },
  pathDisplay: {
    marginBottom: 12,
  },
  pathDisplayContent: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  pathIcon: {
    marginRight: 8,
  },
  pathText: {
    color: colors.text.primary,
    fontSize: 14,
    flex: 1,
  },
  languageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  languageText: {
    color: colors.text.primary,
    fontSize: 14,
  },
  languageSwitch: {
    marginHorizontal: 8,
  },
  scanButton: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  progressBarWrapper: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.background.light,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 0,
  },
  emptyCard: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.text.secondary,
    fontSize: 16,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statTextContainer: {
    marginLeft: 12,
  },
  statValue: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    color: colors.text.secondary,
    fontSize: 12,
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    width: 50,
    backgroundColor: 'rgba(0, 122, 255, 0.3)',
    transform: [{ skewX: '-20deg' }],
  },
  techBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: colors.glow,
  },
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background.light,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  activeNavItem: {
    borderTopWidth: 2,
    borderTopColor: colors.primary,
    backgroundColor: colors.background.card,
  },
  navText: {
    fontSize: 12,
    marginTop: 4,
    color: colors.text.secondary,
  },
  activeNavText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
});

export default App;
