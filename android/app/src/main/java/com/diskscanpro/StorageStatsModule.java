package com.diskscanpro;

import android.app.usage.StorageStatsManager;
import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Environment;
import android.os.StatFs;
import android.os.storage.StorageManager;
import android.os.storage.StorageVolume;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import java.io.File;
import java.io.IOException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class StorageStatsModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;

    public StorageStatsModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @NonNull
    @Override
    public String getName() {
        return "StorageStatsModule";
    }

    @ReactMethod
    public void getStorageStats(Promise promise) {
        try {
            WritableMap result = Arguments.createMap();
            
            // 获取内部存储信息
            File internalStorage = Environment.getDataDirectory();
            StatFs statFs = new StatFs(internalStorage.getAbsolutePath());
            
            long totalBytes = statFs.getTotalBytes();
            long availableBytes = statFs.getAvailableBytes();
            long usedBytes = totalBytes - availableBytes;
            
            result.putDouble("totalBytes", totalBytes);
            result.putDouble("availableBytes", availableBytes);
            result.putDouble("usedBytes", usedBytes);
            
            // 获取外部存储信息（如果可用）
            if (Environment.getExternalStorageState().equals(Environment.MEDIA_MOUNTED)) {
                File externalStorage = Environment.getExternalStorageDirectory();
                StatFs externalStatFs = new StatFs(externalStorage.getAbsolutePath());
                
                long externalTotalBytes = externalStatFs.getTotalBytes();
                long externalAvailableBytes = externalStatFs.getAvailableBytes();
                long externalUsedBytes = externalTotalBytes - externalAvailableBytes;
                
                result.putDouble("externalTotalBytes", externalTotalBytes);
                result.putDouble("externalAvailableBytes", externalAvailableBytes);
                result.putDouble("externalUsedBytes", externalUsedBytes);
            }
            
            // 获取存储卷信息
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                StorageManager storageManager = (StorageManager) reactContext.getSystemService(Context.STORAGE_SERVICE);
                List<StorageVolume> volumes = storageManager.getStorageVolumes();
                
                WritableArray volumesArray = Arguments.createArray();
                for (StorageVolume volume : volumes) {
                    WritableMap volumeMap = Arguments.createMap();
                    volumeMap.putString("description", volume.getDescription(reactContext));
                    volumeMap.putString("state", volume.getState());
                    volumeMap.putBoolean("primary", volume.isPrimary());
                    volumeMap.putBoolean("emulated", volume.isEmulated());
                    volumeMap.putBoolean("removable", volume.isRemovable());
                    
                    // 尝试获取路径
                    try {
                        Method getPathMethod = StorageVolume.class.getDeclaredMethod("getPath");
                        getPathMethod.setAccessible(true);
                        String path = (String) getPathMethod.invoke(volume);
                        volumeMap.putString("path", path);
                        
                        // 获取此卷的存储统计信息
                        try {
                            StatFs volumeStatFs = new StatFs(path);
                            volumeMap.putDouble("totalBytes", volumeStatFs.getTotalBytes());
                            volumeMap.putDouble("availableBytes", volumeStatFs.getAvailableBytes());
                            volumeMap.putDouble("usedBytes", volumeStatFs.getTotalBytes() - volumeStatFs.getAvailableBytes());
                        } catch (Exception e) {
                            // 忽略无法访问的卷
                        }
                    } catch (Exception e) {
                        // 忽略无法获取路径的卷
                    }
                    
                    volumesArray.pushMap(volumeMap);
                }
                result.putArray("volumes", volumesArray);
            }
            
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("STORAGE_STATS_ERROR", "Failed to get storage stats: " + e.getMessage(), e);
        }
    }

    @ReactMethod
    public void getInstalledApps(Promise promise) {
        try {
            PackageManager pm = reactContext.getPackageManager();
            List<PackageInfo> packages = pm.getInstalledPackages(0);
            
            WritableArray appsArray = Arguments.createArray();
            
            for (PackageInfo packageInfo : packages) {
                WritableMap appMap = Arguments.createMap();
                appMap.putString("packageName", packageInfo.packageName);
                
                try {
                    ApplicationInfo appInfo = pm.getApplicationInfo(packageInfo.packageName, 0);
                    appMap.putString("appName", pm.getApplicationLabel(appInfo).toString());
                    appMap.putBoolean("isSystemApp", (appInfo.flags & ApplicationInfo.FLAG_SYSTEM) != 0);
                    
                    // 获取应用图标（作为Base64字符串）
                    // 注意：这可能会消耗较多内存，实际应用中可能需要优化
                    // 这里简化处理，不返回图标数据
                    
                    // 获取应用大小信息
                    File appDir = new File(appInfo.sourceDir);
                    long appSize = appDir.length();
                    appMap.putDouble("appSize", appSize);
                    
                    // 尝试获取数据目录大小
                    File dataDir = new File(appInfo.dataDir);
                    long dataDirSize = calculateDirectorySize(dataDir);
                    appMap.putDouble("dataSize", dataDirSize);
                    
                    // 计算缓存大小（如果可以访问）
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        try {
                            StorageStatsManager storageStatsManager = (StorageStatsManager) 
                                    reactContext.getSystemService(Context.STORAGE_STATS_SERVICE);
                            
                            UUID storageUuid = StorageManager.UUID_DEFAULT;
                            int userId = android.os.Process.myUserHandle().hashCode();
                            
                            android.app.usage.StorageStats stats = 
                                    storageStatsManager.queryStatsForPackage(
                                            storageUuid, packageInfo.packageName, 
                                            android.os.Process.myUserHandle());
                            
                            appMap.putDouble("cacheSize", stats.getCacheBytes());
                            appMap.putDouble("totalSize", stats.getAppBytes() + stats.getDataBytes() + stats.getCacheBytes());
                        } catch (Exception e) {
                            // 忽略权限问题或其他错误
                        }
                    }
                    
                    appsArray.pushMap(appMap);
                } catch (Exception e) {
                    // 忽略无法获取详细信息的应用
                }
            }
            
            promise.resolve(appsArray);
        } catch (Exception e) {
            promise.reject("APP_LIST_ERROR", "Failed to get installed apps: " + e.getMessage(), e);
        }
    }
    
    private long calculateDirectorySize(File dir) {
        if (dir == null || !dir.exists() || !dir.canRead()) {
            return 0;
        }
        
        long size = 0;
        File[] files = dir.listFiles();
        
        if (files == null) {
            return 0;
        }
        
        for (File file : files) {
            if (file.isFile()) {
                size += file.length();
            } else {
                size += calculateDirectorySize(file);
            }
        }
        
        return size;
    }
} 