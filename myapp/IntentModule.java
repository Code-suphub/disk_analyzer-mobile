package com.myapp;

import android.content.Intent;
import android.net.Uri;
import android.provider.Settings;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

public class IntentModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;

    public IntentModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "CustomIntentAndroid";
    }

    @ReactMethod
    public void openSettings(String action) {
        try {
            Intent intent = new Intent(action);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            
            // 如果是管理所有文件访问权限的 intent，添加包名
            if (action.equals("android.settings.MANAGE_ALL_FILES_ACCESS_PERMISSION")) {
                intent.setData(Uri.parse("package:" + reactContext.getPackageName()));
            }
            
            reactContext.startActivity(intent);
        } catch (Exception e) {
            // 如果打开特定设置页面失败，尝试打开应用设置页面
            try {
                Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                intent.setData(Uri.parse("package:" + reactContext.getPackageName()));
                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                reactContext.startActivity(intent);
            } catch (Exception e2) {
                // 如果还是失败，打开系统设置主页
                Intent intent = new Intent(Settings.ACTION_SETTINGS);
                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                reactContext.startActivity(intent);
            }
        }
    }
} 