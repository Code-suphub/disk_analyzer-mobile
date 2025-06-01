# DiskScan Pro | 磁盘扫描专家

<p align="center">
  <img src="./screenshots/app_logo.png" alt="DiskScan Pro Logo" width="120" height="120" />
</p>

[English](#english) | [中文](#中文)

---

<a name="english"></a>
## 📱 DiskScan Pro

An advanced React Native application for analyzing disk space usage on Android devices, with a modern tech-style UI and comprehensive file system analysis.

### ✨ Features

- **File System Exploration**: Browse and scan any accessible directory
- **Folder Size Analysis**: Visualize folder sizes with progress bars and percentage indicators
- **Smart Folder Navigation**: Expand/collapse folders with animations for better navigation
- **Storage Statistics**: View detailed storage statistics, including internal and external storage
- **App Usage Analysis**: See which apps are consuming the most space on your device
- **Caching System**: Improved scanning performance with intelligent caching
- **Language Support**: Switch between English and Chinese interfaces
- **Modern UI**: Tech-inspired dark theme with gradients, animations, and custom components

### 📋 Requirements

- Node.js 18 or higher
- JDK 11 or higher
- Android SDK 33 or higher
- React Native CLI
- Android device or emulator (Android 6.0+)

### 🚀 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Code-suphub/disk_analyzer.git
   cd disk_analyzer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Install pods (for iOS):
   ```bash
   cd ios && pod install && cd ..
   ```

### 🏃‍♂️ Running the App

#### Development Mode

1. Start Metro server:
   ```bash
   npx react-native start
   ```

2. Run on Android:
   ```bash
   npx react-native run-android
   ```

3. Run on iOS (macOS only):
   ```bash
   npx react-native run-ios
   ```

#### Troubleshooting

If you encounter any issues:

1. Clear cache:
   ```bash
   npx react-native start --reset-cache
   ```

2. Clean Android build:
   ```bash
   cd android && ./gradlew clean && cd ..
   ```

3. Rebuild the app:
   ```bash
   npx react-native run-android
   ```

### 📦 Building for Production

#### Android APK

1. Navigate to the Android directory:
   ```bash
   cd android
   ```

2. Build the release APK:
   ```bash
   ./gradlew assembleRelease
   ```

3. The APK will be located at:
   ```
   android/app/build/outputs/apk/release/app-release.apk
   ```

#### Android App Bundle (AAB)

1. Navigate to the Android directory:
   ```bash
   cd android
   ```

2. Build the release bundle:
   ```bash
   ./gradlew bundleRelease
   ```

3. The AAB will be located at:
   ```
   android/app/build/outputs/bundle/release/app-release.aab
   ```

### ⚙️ Configuration

#### Permissions

The app requires the following permissions:
- `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE` for Android 12 and below
- `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO`, and `READ_MEDIA_AUDIO` for Android 13+
- `MANAGE_EXTERNAL_STORAGE` for full file system access (Android 11+)
- `QUERY_ALL_PACKAGES` for app usage analysis

#### Storage Access

For full file system access on Android 11+, users need to grant "All files access" permission in system settings. The app guides users through this process.

### 🧪 Testing

1. Run unit tests:
   ```bash
   npm test
   ```

2. Run integration tests:
   ```bash
   npm run test:e2e
   ```

3. Test on a physical device:
   - Connect your device via USB
   - Enable USB debugging
   - Run: `npx react-native run-android --device`

### 📊 Performance Considerations

- The app uses a smart caching system to improve scanning performance
- For optimal performance, avoid scanning very large directories without caching
- On older devices, scanning the entire file system may take longer

---

<a name="中文"></a>
## 📱 磁盘扫描专家

一款基于React Native的高级磁盘空间分析应用，具有现代科技风格界面和全面的文件系统分析功能。

### ✨ 功能特点

- **文件系统浏览**：浏览和扫描任何可访问的目录
- **文件夹大小分析**：通过进度条和百分比指示器可视化文件夹大小
- **智能文件夹导航**：带动画效果的文件夹展开/折叠功能，便于导航
- **存储统计信息**：查看详细的存储统计信息，包括内部和外部存储
- **应用占用分析**：查看哪些应用占用了设备上的最多空间
- **缓存系统**：通过智能缓存提高扫描性能
- **语言支持**：在英文和中文界面之间切换
- **现代界面**：科技感十足的深色主题，带有渐变、动画和自定义组件

### 📋 系统要求

- Node.js 18或更高版本
- JDK 11或更高版本
- Android SDK 33或更高版本
- React Native CLI
- Android设备或模拟器（Android 6.0+）

### 🚀 安装步骤

1. 克隆仓库：
   ```bash
   git clone https://github.com/yourusername/diskscan-pro.git
   cd diskscan-pro
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 安装pods（仅iOS）：
   ```bash
   cd ios && pod install && cd ..
   ```

### 🏃‍♂️ 运行应用

#### 开发模式

1. 启动Metro服务器：
   ```bash
   npx react-native start
   ```

2. 在Android上运行：
   ```bash
   npx react-native run-android
   ```

3. 在iOS上运行（仅限macOS）：
   ```bash
   npx react-native run-ios
   ```

#### 问题排查

如果遇到任何问题：

1. 清除缓存：
   ```bash
   npx react-native start --reset-cache
   ```

2. 清理Android构建：
   ```bash
   cd android && ./gradlew clean && cd ..
   ```

3. 重新构建应用：
   ```bash
   npx react-native run-android
   ```

### 📦 生产环境打包

#### Android APK

1. 进入Android目录：
   ```bash
   cd android
   ```

2. 构建发布版APK：
   ```bash
   ./gradlew assembleRelease
   ```

3. APK文件位置：
   ```
   android/app/build/outputs/apk/release/app-release.apk
   ```

#### Android应用包（AAB）

1. 进入Android目录：
   ```bash
   cd android
   ```

2. 构建发布版应用包：
   ```bash
   ./gradlew bundleRelease
   ```

3. AAB文件位置：
   ```
   android/app/build/outputs/bundle/release/app-release.aab
   ```

### ⚙️ 配置说明

#### 权限

应用需要以下权限：
- `READ_EXTERNAL_STORAGE`和`WRITE_EXTERNAL_STORAGE`（适用于Android 12及以下版本）
- `READ_MEDIA_IMAGES`、`READ_MEDIA_VIDEO`和`READ_MEDIA_AUDIO`（适用于Android 13+）
- `MANAGE_EXTERNAL_STORAGE`（用于完整文件系统访问，Android 11+）
- `QUERY_ALL_PACKAGES`（用于应用占用分析）

#### 存储访问

对于Android 11+的完整文件系统访问，用户需要在系统设置中授予"所有文件访问权限"。应用会引导用户完成此过程。

### 🧪 测试

1. 运行单元测试：
   ```bash
   npm test
   ```

2. 运行集成测试：
   ```bash
   npm run test:e2e
   ```

3. 在物理设备上测试：
   - 通过USB连接设备
   - 启用USB调试
   - 运行：`npx react-native run-android --device`

### 📊 性能考虑

- 应用使用智能缓存系统提高扫描性能
- 为获得最佳性能，避免在不使用缓存的情况下扫描非常大的目录
- 在较旧的设备上，扫描整个文件系统可能需要较长时间

---

## 📷 Screenshots | 截图

<div align="center">
  <img src="./screenshots/file_explorer.png" alt="File Explorer" width="240" />
  <img src="./screenshots/storage_stats.png" alt="Storage Stats" width="240" />
  <img src="./screenshots/app_usage.png" alt="App Usage" width="240" />
</div>

## 📄 License | 许可证

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

本项目基于MIT许可证 - 详情请参阅[LICENSE](LICENSE)文件。
