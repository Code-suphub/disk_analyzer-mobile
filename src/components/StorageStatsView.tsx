import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { colors } from '../theme/colors';
import StorageStatsModule, { StorageStats, AppInfo } from '../utils/StorageStatsModule';
import { TechCard } from './TechCard';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

interface StorageStatsViewProps {
  translations: any;
}

export const StorageStatsView: React.FC<StorageStatsViewProps> = ({ translations: t }) => {
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [appsList, setAppsList] = useState<AppInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'storage' | 'apps'>('storage');
  const [sortBy, setSortBy] = useState<'size' | 'name'>('size');
  const [showSystemApps, setShowSystemApps] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const stats = await StorageStatsModule.getStorageStats();
      setStorageStats(stats);

      const apps = await StorageStatsModule.getInstalledApps();
      setAppsList(apps);
    } catch (error) {
      console.error('Error loading storage stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFilteredApps = () => {
    let filtered = [...appsList];
    
    if (!showSystemApps) {
      filtered = filtered.filter(app => !app.isSystemApp);
    }
    
    if (sortBy === 'size') {
      filtered.sort((a, b) => {
        const aSize = a.totalSize || a.appSize + (a.dataSize || 0);
        const bSize = b.totalSize || b.appSize + (b.dataSize || 0);
        return bSize - aSize;
      });
    } else {
      filtered.sort((a, b) => a.appName.localeCompare(b.appName));
    }
    
    return filtered;
  };

  const renderStorageOverview = () => {
    if (!storageStats) return null;

    const internalTotal = storageStats.totalBytes;
    const internalUsed = storageStats.usedBytes;
    const internalPercentage = (internalUsed / internalTotal) * 100;

    return (
      <View>
        <TechCard style={styles.overviewCard}>
          <Text style={styles.cardTitle}>{t.internalStorage}</Text>
          <View style={styles.storageBar}>
            <View style={[styles.storageBarFill, { width: `${internalPercentage}%` }]} />
          </View>
          <View style={styles.storageDetails}>
            <Text style={styles.storageUsed}>{formatSize(internalUsed)} {t.used}</Text>
            <Text style={styles.storageAvailable}>
              {formatSize(storageStats.availableBytes)} {t.available}
            </Text>
          </View>
          <Text style={styles.storageTotal}>
            {t.total}: {formatSize(internalTotal)}
          </Text>
        </TechCard>

        {storageStats.externalTotalBytes && (
          <TechCard style={styles.overviewCard}>
            <Text style={styles.cardTitle}>{t.externalStorage}</Text>
            <View style={styles.storageBar}>
              <View
                style={[
                  styles.storageBarFill,
                  {
                    width: `${(storageStats.externalUsedBytes! / storageStats.externalTotalBytes!) * 100}%`,
                    backgroundColor: colors.secondary,
                  },
                ]}
              />
            </View>
            <View style={styles.storageDetails}>
              <Text style={styles.storageUsed}>{formatSize(storageStats.externalUsedBytes!)} {t.used}</Text>
              <Text style={styles.storageAvailable}>
                {formatSize(storageStats.externalAvailableBytes!)} {t.available}
              </Text>
            </View>
            <Text style={styles.storageTotal}>
              {t.total}: {formatSize(storageStats.externalTotalBytes)}
            </Text>
          </TechCard>
        )}

        {storageStats.volumes && storageStats.volumes.length > 0 && (
          <View style={styles.volumesSection}>
            <Text style={styles.sectionTitle}>{t.storageVolumes}</Text>
            {storageStats.volumes.map((volume, index) => {
              if (!volume.totalBytes) return null;
              
              const volumePercentage = (volume.usedBytes! / volume.totalBytes) * 100;
              
              return (
                <TechCard key={`volume-${index}`} style={styles.volumeCard}>
                  <Text style={styles.volumeName}>
                    {volume.description} {volume.primary ? `(${t.primary})` : ''}
                  </Text>
                  <Text style={styles.volumePath}>{volume.path}</Text>
                  <View style={styles.storageBar}>
                    <View
                      style={[
                        styles.storageBarFill,
                        { width: `${volumePercentage}%` },
                      ]}
                    />
                  </View>
                  <View style={styles.storageDetails}>
                    <Text style={styles.storageUsed}>{formatSize(volume.usedBytes!)} {t.used}</Text>
                    <Text style={styles.storageAvailable}>
                      {formatSize(volume.availableBytes!)} {t.available}
                    </Text>
                  </View>
                </TechCard>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  const renderAppsOverview = () => {
    const filteredApps = getFilteredApps();
    
    return (
      <View>
        <View style={styles.appControls}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowSystemApps(!showSystemApps)}>
            <Icon
              name={showSystemApps ? 'check-box-outline' : 'checkbox-blank-outline'}
              size={20}
              color={colors.text.primary}
            />
            <Text style={styles.filterButtonText}>{t.showSystemApps}</Text>
          </TouchableOpacity>
          
          <View style={styles.sortButtons}>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'size' && styles.activeSortButton]}
              onPress={() => setSortBy('size')}>
              <Text
                style={[styles.sortButtonText, sortBy === 'size' && styles.activeSortButtonText]}>
                {t.sortBySize}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'name' && styles.activeSortButton]}
              onPress={() => setSortBy('name')}>
              <Text
                style={[styles.sortButtonText, sortBy === 'name' && styles.activeSortButtonText]}>
                {t.sortByName}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {filteredApps.map((app, index) => {
          const appTotalSize = app.totalSize || app.appSize + (app.dataSize || 0);
          
          return (
            <TechCard key={`app-${index}`} style={styles.appCard}>
              <View style={styles.appHeader}>
                <View style={styles.appIconPlaceholder}>
                  <Icon
                    name={app.isSystemApp ? 'android' : 'cellphone'}
                    size={24}
                    color={app.isSystemApp ? colors.warning : colors.primary}
                  />
                </View>
                <View style={styles.appInfo}>
                  <Text style={styles.appName}>{app.appName}</Text>
                  <Text style={styles.packageName}>{app.packageName}</Text>
                </View>
              </View>
              
              <View style={styles.appSizeContainer}>
                <View style={styles.appSizeBar}>
                  {app.appSize > 0 && (
                    <View
                      style={[
                        styles.appSizeBarSegment,
                        {
                          width: `${(app.appSize / appTotalSize) * 100}%`,
                          backgroundColor: colors.primary,
                        },
                      ]}
                    />
                  )}
                  {app.dataSize > 0 && (
                    <View
                      style={[
                        styles.appSizeBarSegment,
                        {
                          width: `${(app.dataSize / appTotalSize) * 100}%`,
                          backgroundColor: colors.secondary,
                        },
                      ]}
                    />
                  )}
                  {app.cacheSize && app.cacheSize > 0 && (
                    <View
                      style={[
                        styles.appSizeBarSegment,
                        {
                          width: `${(app.cacheSize / appTotalSize) * 100}%`,
                          backgroundColor: colors.warning,
                        },
                      ]}
                    />
                  )}
                </View>
                
                <View style={styles.appSizeDetails}>
                  <Text style={styles.appSizeTotal}>
                    {t.total}: {formatSize(appTotalSize)}
                  </Text>
                  {app.appSize > 0 && (
                    <View style={styles.appSizeItem}>
                      <View style={[styles.appSizeLegend, { backgroundColor: colors.primary }]} />
                      <Text style={styles.appSizeText}>
                        {t.app}: {formatSize(app.appSize)}
                      </Text>
                    </View>
                  )}
                  {app.dataSize > 0 && (
                    <View style={styles.appSizeItem}>
                      <View style={[styles.appSizeLegend, { backgroundColor: colors.secondary }]} />
                      <Text style={styles.appSizeText}>
                        {t.data}: {formatSize(app.dataSize)}
                      </Text>
                    </View>
                  )}
                  {app.cacheSize && app.cacheSize > 0 && (
                    <View style={styles.appSizeItem}>
                      <View style={[styles.appSizeLegend, { backgroundColor: colors.warning }]} />
                      <Text style={styles.appSizeText}>
                        {t.cache}: {formatSize(app.cacheSize)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </TechCard>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'storage' && styles.activeTab]}
          onPress={() => setActiveTab('storage')}>
          <Icon
            name="harddisk"
            size={20}
            color={activeTab === 'storage' ? colors.primary : colors.text.secondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'storage' && styles.activeTabText,
            ]}>
            {t.storageOverview}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'apps' && styles.activeTab]}
          onPress={() => setActiveTab('apps')}>
          <Icon
            name="cellphone"
            size={20}
            color={activeTab === 'apps' ? colors.primary : colors.text.secondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'apps' && styles.activeTabText,
            ]}>
            {t.appsUsage}
          </Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t.loading}</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }>
          {activeTab === 'storage' ? renderStorageOverview() : renderAppsOverview()}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: colors.text.primary,
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background.light,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    marginLeft: 8,
    color: colors.text.secondary,
    fontSize: 14,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  overviewCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 12,
  },
  storageBar: {
    height: 8,
    backgroundColor: colors.background.dark,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  storageBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  storageDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  storageUsed: {
    fontSize: 14,
    color: colors.text.primary,
  },
  storageAvailable: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  storageTotal: {
    fontSize: 12,
    color: colors.text.hint,
  },
  volumesSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 12,
  },
  volumeCard: {
    marginBottom: 12,
  },
  volumeName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  volumePath: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  appControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButtonText: {
    marginLeft: 8,
    color: colors.text.primary,
    fontSize: 14,
  },
  sortButtons: {
    flexDirection: 'row',
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
    backgroundColor: colors.background.light,
  },
  activeSortButton: {
    backgroundColor: colors.primary,
  },
  sortButtonText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  activeSortButtonText: {
    color: colors.text.primary,
    fontWeight: 'bold',
  },
  appCard: {
    marginBottom: 12,
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  appIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.background.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  packageName: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  appSizeContainer: {
    marginTop: 8,
  },
  appSizeBar: {
    height: 8,
    backgroundColor: colors.background.dark,
    borderRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: 8,
  },
  appSizeBarSegment: {
    height: '100%',
  },
  appSizeDetails: {
    marginTop: 4,
  },
  appSizeTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  appSizeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  appSizeLegend: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 8,
  },
  appSizeText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
}); 