import React, { useEffect, useState } from 'react'
import { StyleSheet, Text, TextInput, View, Modal, Pressable } from 'react-native'
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Accent } from '@/constants/theme'
import { useTronWallet } from '@/contexts/TronWalletContext'

function ConnectButton() {
  const { isConnected, connect, disconnect, launchTronLinkConnect } = useTronWallet()
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [inputAddress, setInputAddress] = useState('')

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

  const handleConnect = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    // Show the address input modal directly
    setShowAddressModal(true)
  }

  const handleOpenTronLink = async () => {
    await launchTronLinkConnect()
  }

  const handleSubmitAddress = () => {
    connect(inputAddress)
    setShowAddressModal(false)
    setInputAddress('')
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
            <Text style={btnStyles.text}>Disconnect TronLink Pro</Text>
          </Animated.View>
        </Animated.View>
      </View>
    )
  }

  return (
    <>
      <Animated.View style={scaleStyle}>
        <View style={btnStyles.connectWrap}>
          <Animated.View style={[btnStyles.glow, glowStyle]} />
          <Animated.View
            style={btnStyles.connect}
            onTouchStart={pressIn}
            onTouchEnd={() => { pressOut(); handleConnect() }}
          >
            <Text style={btnStyles.text}>Connect TronLink Pro</Text>
          </Animated.View>
        </View>
      </Animated.View>

      {/* Address Input Modal */}
      <Modal
        visible={showAddressModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddressModal(false)}
      >
        <View style={modalStyles.overlay}>
          <View style={modalStyles.card}>
            <Text style={modalStyles.title}>Connect TronLink Pro</Text>
            <Text style={modalStyles.subtitle}>
              1. Open TronLink Pro and copy your wallet address{'\n'}
              2. Come back here and paste it below
            </Text>

            <Pressable style={modalStyles.openTronLinkBtn} onPress={handleOpenTronLink}>
              <Text style={modalStyles.openTronLinkText}>Open TronLink Pro →</Text>
            </Pressable>

            <TextInput
              style={modalStyles.input}
              value={inputAddress}
              onChangeText={setInputAddress}
              placeholder="Paste your TRON address (T...)"
              placeholderTextColor={Accent.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={modalStyles.btnRow}>
              <Pressable
                style={modalStyles.cancelBtn}
                onPress={() => { setShowAddressModal(false); setInputAddress('') }}
              >
                <Text style={modalStyles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[modalStyles.confirmBtn, !inputAddress && { opacity: 0.5 }]}
                onPress={handleSubmitAddress}
                disabled={!inputAddress}
              >
                <Text style={modalStyles.confirmText}>Connect</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  )
}

const btnStyles = StyleSheet.create({
  connectWrap: {
    position: 'relative',
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    backgroundColor: '#FF0013',
    transform: [{ scaleX: 1.04 }, { scaleY: 1.15 }],
  },
  connect: {
    backgroundColor: '#FF0013',
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

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    backgroundColor: Accent.card,
    borderRadius: 20,
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Accent.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: Accent.textSecondary,
    marginBottom: 16,
    lineHeight: 22,
  },
  openTronLinkBtn: {
    backgroundColor: 'rgba(255, 0, 19, 0.1)',
    borderWidth: 1,
    borderColor: '#FF0013',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  openTronLinkText: {
    color: '#FF0013',
    fontWeight: '700',
    fontSize: 15,
  },
  input: {
    backgroundColor: Accent.surface,
    borderRadius: 12,
    padding: 14,
    color: Accent.textPrimary,
    fontFamily: 'monospace',
    fontSize: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Accent.muted,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Accent.muted,
    alignItems: 'center',
  },
  cancelText: {
    color: Accent.textSecondary,
    fontWeight: '600',
    fontSize: 15,
  },
  confirmBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FF0013',
    alignItems: 'center',
  },
  confirmText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
})

export default ConnectButton