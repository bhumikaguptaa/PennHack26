import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Accent, Colors } from '@/constants/theme';

function AnimatedTabIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  const scale = useSharedValue(1);
  const dotScale = useSharedValue(0.8);
  const dotOpacity = useSharedValue(0.5);

  useEffect(() => {
    if (focused) {
      scale.value = withSpring(1.15, { damping: 12 });
      dotScale.value = withRepeat(
        withTiming(1.2, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        -1, true,
      );
      dotOpacity.value = withRepeat(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        -1, true,
      );
    } else {
      scale.value = withSpring(1, { damping: 12 });
      cancelAnimation(dotScale);
      cancelAnimation(dotOpacity);
      dotScale.value = withTiming(0.8, { duration: 200 });
      dotOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [focused]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
    opacity: dotOpacity.value,
  }));

  return (
    <View style={tabStyles.iconWrap}>
      <Animated.View style={iconStyle}>
        <IconSymbol size={28} name={name as any} color={color} />
      </Animated.View>
      <Animated.View style={[tabStyles.activeDot, dotStyle]} />
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Accent.blue,
    marginTop: 3,
  },
});

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Accent.blue,
        tabBarInactiveTintColor: Accent.textTertiary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: Accent.surface,
          borderTopColor: Accent.muted,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon name="house.fill" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="pay"
        options={{
          title: 'Pay',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon name="creditcard.fill" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
