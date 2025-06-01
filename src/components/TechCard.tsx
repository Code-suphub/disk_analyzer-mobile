import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { colors } from '../theme/colors';
import LinearGradient from 'react-native-linear-gradient';

interface TechCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  glowing?: boolean;
  active?: boolean;
  hoverable?: boolean;
}

export const TechCard: React.FC<TechCardProps> = ({
  children,
  style,
  onPress,
  glowing = false,
  active = false,
  hoverable = false,
}) => {
  const scale = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (active) {
      Animated.timing(scale, {
        toValue: 1.02,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(scale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [active, scale]);

  const handlePressIn = () => {
    if (hoverable) {
      Animated.spring(scale, {
        toValue: 0.98,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (hoverable) {
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  };

  const renderContent = () => (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ scale }] },
        glowing && styles.glowing,
        style,
      ]}>
      <LinearGradient
        colors={colors.background.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}>
        <View style={styles.border}>
          <View style={styles.content}>{children}</View>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}>
        {renderContent()}
      </TouchableOpacity>
    );
  }

  return renderContent();
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 8,
    elevation: 5,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  gradient: {
    borderRadius: 12,
  },
  border: {
    margin: 1,
    borderRadius: 11,
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: {
    padding: 16,
  },
  glowing: {
    shadowColor: colors.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 8,
  },
}); 