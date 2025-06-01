import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { colors } from '../theme/colors';
import { ProgressBar } from '@react-native-community/progress-bar-android';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface FileItemProps {
  name: string;
  path: string;
  size: number;
  isDirectory: boolean;
  percentage: number;
  level: number;
  isExpanded: boolean;
  onPress: () => void;
}

export const TechFileItem: React.FC<FileItemProps> = ({
  name,
  path,
  size,
  isDirectory,
  percentage,
  level,
  isExpanded,
  onPress,
}) => {
  const [showPath, setShowPath] = useState(false);
  const rotateAnim = useState(new Animated.Value(isExpanded ? 1 : 0))[0];
  const heightAnim = useState(new Animated.Value(isExpanded ? 1 : 0))[0];

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(rotateAnim, {
        toValue: isExpanded ? 1 : 0,
        duration: 300,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.timing(heightAnim, {
        toValue: isExpanded ? 1 : 0,
        duration: 300,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: false,
      }),
    ]).start();
  }, [isExpanded, rotateAnim, heightAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = () => {
    if (isDirectory) {
      return isExpanded ? 'folder-open' : 'folder';
    }

    // 根据文件类型选择图标
    if (path.endsWith('.jpg') || path.endsWith('.png') || path.endsWith('.jpeg') || path.endsWith('.gif')) {
      return 'file-image';
    } else if (path.endsWith('.mp4') || path.endsWith('.avi') || path.endsWith('.mov')) {
      return 'file-video';
    } else if (path.endsWith('.mp3') || path.endsWith('.wav') || path.endsWith('.ogg')) {
      return 'file-music';
    } else if (path.endsWith('.pdf')) {
      return 'file-pdf';
    } else if (path.endsWith('.doc') || path.endsWith('.docx')) {
      return 'file-word';
    } else if (path.endsWith('.xls') || path.endsWith('.xlsx')) {
      return 'file-excel';
    } else if (path.endsWith('.ppt') || path.endsWith('.pptx')) {
      return 'file-powerpoint';
    } else if (path.endsWith('.zip') || path.endsWith('.rar') || path.endsWith('.7z')) {
      return 'file-zip';
    } else {
      return 'file-document';
    }
  };

  const getIconColor = () => {
    if (isDirectory) {
      return '#FFD54F';
    }

    if (path.endsWith('.jpg') || path.endsWith('.png') || path.endsWith('.jpeg') || path.endsWith('.gif')) {
      return '#4CAF50';
    } else if (path.endsWith('.mp4') || path.endsWith('.avi') || path.endsWith('.mov')) {
      return '#F44336';
    } else if (path.endsWith('.mp3') || path.endsWith('.wav') || path.endsWith('.ogg')) {
      return '#9C27B0';
    } else if (path.endsWith('.pdf')) {
      return '#FF5722';
    } else if (path.endsWith('.doc') || path.endsWith('.docx')) {
      return '#2196F3';
    } else if (path.endsWith('.xls') || path.endsWith('.xlsx')) {
      return '#4CAF50';
    } else if (path.endsWith('.ppt') || path.endsWith('.pptx')) {
      return '#FF9800';
    } else if (path.endsWith('.zip') || path.endsWith('.rar') || path.endsWith('.7z')) {
      return '#795548';
    } else {
      return colors.text.secondary;
    }
  };

  return (
    <View style={[styles.container, { marginLeft: level * 16 }]}>
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={onPress}
        onLongPress={() => setShowPath(!showPath)}>
        <View style={styles.iconContainer}>
          {isDirectory && (
            <View style={styles.arrowContainer}>
              <Animated.View style={{ transform: [{ rotate }] }}>
                <Icon
                  name="chevron-right"
                  size={20}
                  color={colors.text.secondary}
                />
              </Animated.View>
            </View>
          )}
          <Icon name={getFileIcon()} size={24} color={getIconColor()} />
        </View>
        
        <View style={styles.contentContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="middle">
              {name}
            </Text>
            <Text style={styles.fileSize}>
              {formatSize(size)} ({percentage.toFixed(1)}%)
            </Text>
          </View>
          
          {showPath && (
            <Text style={styles.filePath} numberOfLines={1} ellipsizeMode="middle">
              {path}
            </Text>
          )}
          
          <View style={styles.progressContainer}>
            <View style={[styles.progressBackground, { width: '100%' }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${Math.min(percentage, 100)}%` }
                ]} 
              />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.background.light,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  arrowContainer: {
    position: 'absolute',
    left: -20,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    width: 20,
  },
  contentContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fileName: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
    marginRight: 8,
  },
  fileSize: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  filePath: {
    fontSize: 10,
    color: colors.text.hint,
    marginTop: 2,
  },
  progressContainer: {
    marginTop: 8,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBackground: {
    height: 4,
    backgroundColor: colors.background.dark,
  },
  progressFill: {
    height: 4,
    backgroundColor: colors.primary,
  },
}); 