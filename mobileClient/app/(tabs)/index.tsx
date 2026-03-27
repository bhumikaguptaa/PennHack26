import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Dimensions, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import ConnectButton from '@/components/connectbutton'
import { useTronWallet } from '@/contexts/TronWalletContext'
import { Accent } from '@/constants/theme'

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

/* ── Pulsing Ring (reanimated) ────────────────────────────── */
const PulseRing = ({ delay, color, duration = 2400 }: { delay: number; color: string; duration?: number }) => {
  const scale = useSharedValue(0.5)
  const opacity = useSharedValue(0.7)

  useEffect(() => {
    const ease = Easing.out(Easing.quad)
    scale.value = withDelay(delay, withRepeat(withTiming(3, { duration, easing: ease }), -1, false))
    opacity.value = withDelay(delay, withRepeat(withTiming(0, { duration, easing: ease }), -1, false))
    return () => { cancelAnimation(scale); cancelAnimation(opacity) }
  }, [delay, duration])

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  return <Animated.View style={[styles.pulseRing, { borderColor: color }, style]} />
}

/* ── Breathing Dot ────────────────────────────────────────── */
const BreathingDot = ({ color, size = 8 }: { color: string; size?: number }) => {
  const opacity = useSharedValue(1)

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 1000 }),
        withTiming(1, { duration: 1000 }),
      ), -1, true,
    )
    return () => cancelAnimation(opacity)
  }, [])

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }))

  return (
    <Animated.View
      style={[
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        style,
      ]}
    />
  )
}

/* ── Full-screen Wipe Transition ──────────────────────────── */
const TransitionWipe = ({ onDone }: { onDone: () => void }) => {
  const s1 = useSharedValue(0)
  const s2 = useSharedValue(0)
  const s3 = useSharedValue(0)
  const o1 = useSharedValue(1)
  const o2 = useSharedValue(1)
  const o3 = useSharedValue(1)

  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    const dur = 575
    s1.value = withTiming(40, { duration: dur })
    s2.value = withDelay(230, withTiming(40, { duration: dur }))
    s3.value = withDelay(460, withTiming(40, { duration: dur }))

    o1.value = withDelay(690, withTiming(0, { duration: 345 }))
    o2.value = withDelay(805, withTiming(0, { duration: 345 }))
    o3.value = withDelay(920, withTiming(0, { duration: 345 }, () => {
      runOnJS(onDone)()
    }))
  }, [])

  const c1 = useAnimatedStyle(() => ({ transform: [{ scale: s1.value }], opacity: o1.value }))
  const c2 = useAnimatedStyle(() => ({ transform: [{ scale: s2.value }], opacity: o2.value }))
  const c3 = useAnimatedStyle(() => ({ transform: [{ scale: s3.value }], opacity: o3.value }))

  const circle = { position: 'absolute' as const, width: 60, height: 60, borderRadius: 30 }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
        <Animated.View style={[circle, { backgroundColor: '#CC0000' }, c1]} />
        <Animated.View style={[circle, { backgroundColor: '#FF0013' }, c2]} />
        <Animated.View style={[circle, { backgroundColor: Accent.green }, c3]} />
      </View>
    </View>
  )
}

/* ── Balance Orb ──────────────────────────────────────────── */
const BalanceOrb = ({ balance, loading }: { balance: string | null; loading: boolean }) => {
  const orbScale = useSharedValue(0.9)
  const textOpacity = useSharedValue(0)

  useEffect(() => {
    if (!loading && balance !== null) {
      orbScale.value = withSpring(1, { damping: 12, stiffness: 120 })
      textOpacity.value = withTiming(1, { duration: 400 })
    } else {
      orbScale.value = withTiming(0.9, { duration: 200 })
      textOpacity.value = withTiming(0, { duration: 200 })
    }
  }, [loading, balance])

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value }],
  }))

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }))

  return (
    <View style={styles.orbContainer}>
      {loading && (
        <View style={StyleSheet.absoluteFill}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
              <PulseRing delay={i * 600} color={'#FF0013'} />
            </View>
          ))}
        </View>
      )}

      <Animated.View style={[styles.orbCircle, orbStyle]}>
        {loading ? (
          <Text style={styles.orbLoadingText}>...</Text>
        ) : (
          <Animated.View style={[{ alignItems: 'center' }, textStyle]}>
            <Text style={styles.orbBalance}>{balance ?? '0'}</Text>
            <Text style={styles.orbCurrency}>TRX</Text>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  )
}

/* ── Disconnected Hero with breathing rings ───────────────── */
const DisconnectedHero = () => (
  <View style={styles.heroSection}>
    <View style={styles.heroOrbWrap}>
      <View style={StyleSheet.absoluteFill}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
            <PulseRing delay={i * 800} color={Accent.muted} duration={3000} />
          </View>
        ))}
      </View>
      <View style={styles.heroIconCircle}>
        <Text style={styles.iconEmoji}>💳</Text>
      </View>
    </View>
    <Text style={styles.heroTitle}>Connect TronLink Pro</Text>
    <Text style={styles.heroDescription}>
      Link your TronLink Pro wallet to view your TRX balance and pay at terminals on the TRON Nile Testnet.
    </Text>
    <View style={styles.connectWrapper}>
      <ConnectButton />
    </View>
  </View>
)

/* ── Main Screen ──────────────────────────────────────────── */
export default function HomeScreen() {
  const { address, isConnected, balance, balanceLoading, refreshBalance } = useTronWallet()
  const [refreshing, setRefreshing] = useState(false)
  const [showWipe, setShowWipe] = useState(false)
  const [wipeComplete, setWipeComplete] = useState(false)
  const prevConnected = useRef(false)

  const balanceBounce = useSharedValue(1)
  const balanceBounceStyle = useAnimatedStyle(() => ({
    transform: [{ scale: balanceBounce.value }],
  }))

  const doRefresh = useCallback(async () => {
    setRefreshing(true)
    await refreshBalance()
    setRefreshing(false)
    balanceBounce.value = withSequence(
      withTiming(1.06, { duration: 150 }),
      withSpring(1, { damping: 10 }),
    )
  }, [refreshBalance])

  useEffect(() => {
    if (isConnected && !prevConnected.current) {
      setShowWipe(true)
      setWipeComplete(false)
    }
    prevConnected.current = isConnected
  }, [isConnected])

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>CryptoPay</Text>
        <Text style={styles.subtitle}>TRON · Nile Testnet</Text>
      </View>

      {!isConnected ? (
        <DisconnectedHero />
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={doRefresh}
              tintColor={'#FF0013'}
            />
          }
        >
          <Animated.View entering={FadeIn.duration(500)} style={balanceBounceStyle}>
            <BalanceOrb balance={balance} loading={balanceLoading} />
          </Animated.View>

          <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.networkBadge}>
            <BreathingDot color={'#FF0013'} />
            <Text style={styles.networkText}>TRON Nile Testnet</Text>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(350).duration(400)} style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Wallet</Text>
              <Text style={styles.infoValue}>{address ? shortenAddress(address) : '—'}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status</Text>
              <View style={styles.statusRow}>
                <BreathingDot color={Accent.green} />
                <Text style={styles.statusText}>Connected</Text>
              </View>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Network</Text>
              <Text style={styles.infoValue}>Nile Testnet</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(500).duration(400)} style={styles.disconnectWrapper}>
            <ConnectButton />
          </Animated.View>
        </ScrollView>
      )}

      {showWipe && !wipeComplete && (
        <TransitionWipe onDone={() => { setWipeComplete(true); setShowWipe(false) }} />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Accent.surface,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 12,
  },
  logo: {
    fontSize: 28,
    fontWeight: '800',
    color: Accent.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: Accent.textTertiary,
    marginTop: 2,
  },
  pulseRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
  },
  heroSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  heroOrbWrap: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  heroIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Accent.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconEmoji: {
    fontSize: 36,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroDescription: {
    fontSize: 15,
    color: Accent.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  connectWrapper: {
    width: '100%',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  orbContainer: {
    alignSelf: 'center',
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  orbCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Accent.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF0013',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  orbLoadingText: {
    fontSize: 28,
    color: Accent.textSecondary,
    fontWeight: '600',
  },
  orbBalance: {
    fontSize: 22,
    fontWeight: '800',
    color: Accent.textPrimary,
  },
  orbCurrency: {
    fontSize: 14,
    fontWeight: '600',
    color: Accent.textTertiary,
    marginTop: 2,
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: Accent.muted,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginBottom: 20,
    gap: 8,
  },
  networkText: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: Accent.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: Accent.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    fontFamily: 'monospace',
  },
  infoDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Accent.muted,
    marginVertical: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: Accent.green,
  },
  disconnectWrapper: {
    marginTop: 8,
  },
})