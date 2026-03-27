import React, { useEffect, useRef } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import * as Haptics from 'expo-haptics'
import { useAppKit, useAccount } from '@reown/appkit-react-native'
import { baseSepolia } from 'viem/chains'
import { Accent } from '@/constants/theme'

const BASE_SEPOLIA_CHAIN_ID = baseSepolia.id

function ConnectButton() {
  const { open, disconnect, switchNetwork } = useAppKit()
  const { address, isConnected, chainId } = useAccount()
  const didAutoSwitch = useRef(false)

  useEffect(() => {
    if (isConnected && chainId && chainId !== BASE_SEPOLIA_CHAIN_ID && !didAutoSwitch.current) {
      didAutoSwitch.current = true
      switchNetwork(baseSepolia).catch(() => {})
    }
    if (!isConnected) {
      didAutoSwitch.current = false
    }
  }, [isConnected, chainId, switchNetwork])

  // Shared values for press animation
  const scale = useSharedValue(1)
  const glowOpacity = useSharedValue(0.3)

  // Pulsing glow for connect button
  useEffect(() => {
    if (!isConnected) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.7, { duration: 1200 }),
          withTiming(0.3, { duration: 1200 }),
        ), -1, true,
      )
    }
    return () => cancelAnimation(glowOpacity)
  }, [isConnected])

  const pressIn = () => {
    scale.value = withTiming(0.96, { duration: 80 })
  }
  const pressOut = () => {
    scale.value = withSpring(1, { damping: 12 })
  }

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }))

  // Shake for disconnect
  const rotation = useSharedValue(0)
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
  }))

  const handleDisconnect = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    rotation.value = withSequence(
      withTiming(2, { duration: 40 }),
      withTiming(-2, { duration: 40 }),
      withTiming(2, { duration: 40 }),
      withTiming(0, { duration: 40 }),
    )
    setTimeout(() => disconnect(), 180)
  }

  if (isConnected) {
    return (
      <View style={{ gap: 8 }}>
        <Animated.View style={shakeStyle}>
          <Animated.View
            style={[btnStyles.disconnect]}
            onTouchStart={pressIn}
            onTouchEnd={() => { pressOut(); handleDisconnect() }}
          >
            <Text style={btnStyles.text}>Disconnect</Text>
          </Animated.View>
        </Animated.View>
      </View>
    )
  }

  return (
    <Animated.View style={scaleStyle}>
      <View style={btnStyles.connectWrap}>
        <Animated.View style={[btnStyles.glow, glowStyle]} />
        <Animated.View
          style={btnStyles.connect}
          onTouchStart={pressIn}
          onTouchEnd={() => { pressOut(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); open() }}
        >
          <Text style={btnStyles.text}>Connect Wallet</Text>
        </Animated.View>
      </View>
    </Animated.View>
  )
}

const btnStyles = StyleSheet.create({
  connectWrap: {
    position: 'relative',
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    backgroundColor: Accent.blue,
    // glow spread
    transform: [{ scaleX: 1.04 }, { scaleY: 1.15 }],
  },
  connect: {
    backgroundColor: Accent.blue,
    padding: 14,
    borderRadius: 12,
  },
  disconnect: {
    backgroundColor: Accent.red,
    padding: 14,
    borderRadius: 12,
  },
  text: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
  },
})

export default ConnectButton