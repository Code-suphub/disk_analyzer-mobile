import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { AppSettings, CACHE_TTL_OPTIONS } from '../utils/settings';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
  translations: any; // 使用实际的翻译类型
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
  settings,
  onSettingsChange,
  translations: t,
}) => {
  const handleCacheEnabledChange = (value: boolean) => {
    onSettingsChange({
      ...settings,
      cache: {
        ...settings.cache,
        enabled: value,
      },
    });
  };

  const handleCacheTTLChange = (value: number) => {
    onSettingsChange({
      ...settings,
      cache: {
        ...settings.cache,
        ttl: value,
      },
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>{t.settings}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.cacheSettings}</Text>
              
              <View style={styles.settingItem}>
                <Text>{t.enableCache}</Text>
                <Switch
                  value={settings.cache.enabled}
                  onValueChange={handleCacheEnabledChange}
                />
              </View>

              {settings.cache.enabled && (
                <View style={styles.settingItem}>
                  <Text>{t.cacheDuration}</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={settings.cache.ttl}
                      onValueChange={handleCacheTTLChange}
                      style={styles.picker}>
                      {CACHE_TTL_OPTIONS.map(option => (
                        <Picker.Item
                          key={option.value}
                          label={option.label}
                          value={option.value}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.saveButton} onPress={onClose}>
            <Text style={styles.saveButtonText}>{t.save}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  scrollView: {
    maxHeight: '80%',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  pickerContainer: {
    flex: 1,
    maxWidth: 150,
  },
  picker: {
    height: 40,
  },
  saveButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 