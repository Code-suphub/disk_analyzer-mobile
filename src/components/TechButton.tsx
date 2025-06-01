import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../theme/colors';
import LinearGradient from 'react-native-linear-gradient';

interface TechButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  loading?: boolean;
  type?: 'primary' | 'secondary' | 'outline';
  icon?: React.ReactNode;
}

export const TechButton: React.FC<TechButtonProps> = ({
  title,
  onPress,
  style,
  textStyle,
  disabled = false,
  loading = false,
  type = 'primary',
  icon,
}) => {
  const getColors = () => {
    switch (type) {
      case 'primary':
        return [colors.primary, colors.primaryDark];
      case 'secondary':
        return [colors.secondary, '#5652CC'];
      case 'outline':
        return ['transparent', 'transparent'];
      default:
        return [colors.primary, colors.primaryDark];
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'primary':
        return 'transparent';
      case 'secondary':
        return 'transparent';
      case 'outline':
        return colors.primary;
      default:
        return 'transparent';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'primary':
      case 'secondary':
        return colors.text.primary;
      case 'outline':
        return colors.primary;
      default:
        return colors.text.primary;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.container, style]}>
      <LinearGradient
        colors={getColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.button,
          { borderColor: getBorderColor() },
          disabled && styles.buttonDisabled,
        ]}>
        {loading ? (
          <ActivityIndicator color={getTextColor()} size="small" />
        ) : (
          <View style={styles.contentContainer}>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <Text
              style={[
                styles.text,
                { color: getTextColor() },
                disabled && styles.textDisabled,
                textStyle,
              ]}>
              {title}
            </Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  button: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  textDisabled: {
    color: colors.text.disabled,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 10,
  },
}); 