import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  Animated,
} from 'react-native';
import RNFS from 'react-native-fs';
import { colors } from '../theme/colors';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { TechButton } from './TechButton';

interface FileBrowserModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPath: (path: string) => void;
  initialPath?: string;
  translations: any;
}

interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
}

export const FileBrowserModal: React.FC<FileBrowserModalProps> = ({
  visible,
  onClose,
  onSelectPath,
  initialPath = RNFS.ExternalStorageDirectoryPath,
  translations: t,
}) => {
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pathHistory, setPathHistory] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      loadFiles(initialPath);
    }
  }, [visible, initialPath]);

  const loadFiles = async (path: string) => {
    try {
      setLoading(true);
      setError('');
      
      const items = await RNFS.readDir(path);
      
      // 排序：文件夹优先，然后按字母排序
      const sortedItems = items
        .filter(item => !item.name.startsWith('.')) // 过滤隐藏文件
        .sort((a, b) => {
          if (a.isDirectory() && !b.isDirectory()) return -1;
          if (!a.isDirectory() && b.isDirectory()) return 1;
          return a.name.localeCompare(b.name);
        })
        .map(item => ({
          name: item.name,
          path: item.path,
          isDirectory: item.isDirectory(),
        }));

      setFiles(sortedItems);
      setCurrentPath(path);
    } catch (err) {
      console.error('Error loading files:', err);
      setError(t.cannotAccessPath);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFolder = (item: FileItem) => {
    if (item.isDirectory) {
      setPathHistory(prev => [...prev, currentPath]);
      loadFiles(item.path);
    }
  };

  const navigateBack = () => {
    if (pathHistory.length > 0) {
      const previousPath = pathHistory[pathHistory.length - 1];
      setPathHistory(prev => prev.slice(0, prev.length - 1));
      loadFiles(previousPath);
    } else {
      // 尝试导航到父目录
      const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
      if (parentPath) {
        loadFiles(parentPath);
      }
    }
  };

  const confirmSelection = () => {
    onSelectPath(currentPath);
    onClose();
  };

  const getCommonPaths = () => {
    return [
      { name: t.internalStorage, path: RNFS.ExternalStorageDirectoryPath },
      { name: t.downloads, path: `${RNFS.ExternalStorageDirectoryPath}/Download` },
      { name: t.pictures, path: `${RNFS.ExternalStorageDirectoryPath}/Pictures` },
      { name: t.dcim, path: `${RNFS.ExternalStorageDirectoryPath}/DCIM` },
    ];
  };

  // 获取面包屑路径
  const getBreadcrumbs = () => {
    const parts = currentPath.split('/').filter(p => p);
    let constructedPath = '';
    const breadcrumbs = parts.map(part => {
      constructedPath += '/' + part;
      return {
        name: part,
        path: constructedPath,
      };
    });
    
    // 添加根目录
    return [{ name: '/', path: '/' }, ...breadcrumbs];
  };

  const renderFileItem = ({ item }: { item: FileItem }) => (
    <TouchableOpacity
      style={styles.fileItem}
      onPress={() => handleSelectFolder(item)}
      disabled={!item.isDirectory}>
      <LinearGradient
        colors={[colors.background.light, colors.background.card]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.fileItemGradient,
          !item.isDirectory && styles.fileItemDisabled,
        ]}>
        <View style={styles.fileIcon}>
          <Icon
            name={item.isDirectory ? 'folder' : 'file-outline'}
            size={24}
            color={item.isDirectory ? '#FFD54F' : colors.text.secondary}
          />
        </View>
        <Text 
          style={[
            styles.fileName, 
            !item.isDirectory && styles.fileNameDisabled
          ]}
          numberOfLines={1}
          ellipsizeMode="middle">
          {item.name}
        </Text>
        {item.isDirectory && (
          <Icon
            name="chevron-right"
            size={20}
            color={colors.text.secondary}
            style={styles.chevron}
          />
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <StatusBar
          backgroundColor={colors.background.dark}
          barStyle="light-content"
        />
        <LinearGradient
          colors={[colors.background.dark, colors.background.main]}
          style={styles.modalContent}>
          {/* 头部 */}
          <View style={styles.header}>
            <Text style={styles.title}>{t.selectPath}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* 路径导航 - 面包屑 */}
          <ScrollView horizontal style={styles.breadcrumbContainer}>
            {getBreadcrumbs().map((crumb, index) => (
              <View style={styles.breadcrumbItem} key={crumb.path}>
                {index > 0 && (
                  <Text style={styles.breadcrumbSeparator}>/</Text>
                )}
                <TouchableOpacity
                  onPress={() => loadFiles(crumb.path)}
                  style={styles.breadcrumbButton}>
                  <Text 
                    style={[
                      styles.breadcrumbText,
                      crumb.path === currentPath && styles.currentBreadcrumb
                    ]}>
                    {crumb.name}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          {/* 快速访问区域 */}
          <View style={styles.quickAccessContainer}>
            <Text style={styles.sectionTitle}>{t.quickAccess}</Text>
            <View style={styles.quickAccessItems}>
              {getCommonPaths().map(path => (
                <TouchableOpacity
                  key={path.path}
                  style={styles.quickAccessItem}
                  onPress={() => loadFiles(path.path)}>
                  <LinearGradient
                    colors={[colors.background.light, colors.background.card]}
                    style={styles.quickAccessGradient}>
                    <Icon
                      name={
                        path.name === t.internalStorage
                          ? 'sd'
                          : path.name === t.downloads
                          ? 'download'
                          : path.name === t.pictures
                          ? 'image'
                          : 'camera'
                      }
                      size={22}
                      color={colors.primary}
                    />
                    <Text style={styles.quickAccessText}>{path.name}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 文件列表 */}
          <View style={styles.fileListContainer}>
            <View style={styles.fileListHeader}>
              <Text style={styles.sectionTitle}>{t.folders}</Text>
              <TouchableOpacity
                style={styles.backButton}
                onPress={navigateBack}
                disabled={currentPath === '/'}>
                <Icon name="arrow-left" size={20} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={colors.primary} size="large" />
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Icon name="alert" size={36} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : (
              <FlatList
                data={files}
                renderItem={renderFileItem}
                keyExtractor={item => item.path}
                style={styles.fileList}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Icon name="folder-open" size={36} color={colors.text.secondary} />
                    <Text style={styles.emptyText}>{t.emptyFolder}</Text>
                  </View>
                }
              />
            )}
          </View>

          {/* 底部按钮 */}
          <View style={styles.footer}>
            <TechButton
              title={t.cancel}
              onPress={onClose}
              type="outline"
              style={styles.footerButton}
            />
            <TechButton
              title={t.select}
              onPress={confirmSelection}
              style={styles.footerButton}
            />
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
};

// 水平滚动视图组件
const ScrollViewComponent = ({ children, style }: any) => {
  const [contentWidth, setContentWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const scrollX = React.useRef(new Animated.Value(0)).current;
  const [scrollPosition, setScrollPosition] = useState(0);
  
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { 
      useNativeDriver: true,
      listener: (event: any) => {
        if (event && event.nativeEvent && typeof event.nativeEvent.contentOffset?.x === 'number') {
          setScrollPosition(event.nativeEvent.contentOffset.x);
        }
      }
    }
  );

  return (
    <View 
      style={[styles.scrollViewContainer, style]}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onContentSizeChange={(width) => setContentWidth(width)}>
        {children}
      </Animated.ScrollView>
      
      {/* 渐变遮罩 - 左侧 */}
      {scrollPosition > 0 && (
        <LinearGradient
          colors={['rgba(30, 30, 30, 0.8)', 'rgba(30, 30, 30, 0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.scrollGradientLeft}
        />
      )}
      
      {/* 渐变遮罩 - 右侧 */}
      {contentWidth > containerWidth && (
        <LinearGradient
          colors={['rgba(30, 30, 30, 0)', 'rgba(30, 30, 30, 0.8)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.scrollGradientRight}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    flex: 1,
    marginTop: 30,
    marginBottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background.light,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  scrollViewContainer: {
    position: 'relative',
  },
  breadcrumbContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: colors.background.light,
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbSeparator: {
    color: colors.text.secondary,
    marginHorizontal: 4,
  },
  breadcrumbButton: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  breadcrumbText: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  currentBreadcrumb: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  scrollGradientLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 20,
  },
  scrollGradientRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 20,
  },
  quickAccessContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 12,
  },
  quickAccessItems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAccessItem: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  quickAccessGradient: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickAccessText: {
    color: colors.text.primary,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  fileListContainer: {
    flex: 1,
    padding: 16,
  },
  fileListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background.light,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  fileList: {
    flex: 1,
  },
  fileItem: {
    marginVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  fileItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
  },
  fileItemDisabled: {
    opacity: 0.6,
  },
  fileIcon: {
    marginRight: 12,
  },
  fileName: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 15,
  },
  fileNameDisabled: {
    color: colors.text.secondary,
  },
  chevron: {
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: colors.error,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: colors.text.secondary,
    marginTop: 8,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerButton: {
    flex: 1,
    marginHorizontal: 8,
  },
}); 