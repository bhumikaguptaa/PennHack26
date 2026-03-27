import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Dimensions,
  Pressable,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import NfcManager, { Ndef, NfcEvents, TagEvent } from 'react-native-nfc-manager';
import { useProvider, useAccount } from '@reown/appkit-react-native';
import { Accent } from '@/constants/theme';

const txTimeoutPromise = (ms: number) =>
  new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Transaction timed out. Please try again or check your wallet app.')), ms)
  );

const { width: SCREEN_W } = Dimensions.get('window');

// --- Types ---
interface RLUSDPaymentPayload {
  type: 'RLUSD_PAY';
  tokenAddress: string;
  to: string;
  amountRaw: string;
  amountUsd: number;
  chainId: number;
}

const ERC20_TRANSFER_SELECTOR = '0xa9059cbb';
function encodeErc20Transfer(to: string, amountRaw: string): string {
  const paddedAddress = to.slice(2).toLowerCase().padStart(64, '0');
  const amountHex = BigInt(amountRaw).toString(16).padStart(64, '0');
  return `${ERC20_TRANSFER_SELECTOR}${paddedAddress}${amountHex}`;
}

const SERVER_URL = "http://10.104.84.121:3001";
const ENABLE_DEBUG_FLOW = false;

type Phase = 'idle' | 'scanning' | 'received' | 'confirm' | 'success';

/* ── Pulse Ring ──────────────────────────────────────────── */
const PulseRing = ({ delay, color, duration = 2400 }: { delay: number; color: string; duration?: number }) => {
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0.7);

  useEffect(() => {
    const ease = Easing.out(Easing.quad);
    scale.value = withDelay(delay, withRepeat(withTiming(3, { duration, easing: ease }), -1, false));
    opacity.value = withDelay(delay, withRepeat(withTiming(0, { duration, easing: ease }), -1, false));
    return () => { cancelAnimation(scale); cancelAnimation(opacity); };
  }, [delay, duration]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.pulseRingBase, { borderColor: color }, style]} />;
};

/* ── Full-screen Wipe ────────────────────────────────────── */
const Wipe = ({ colors, onDone }: { colors: [string, string, string]; onDone: () => void }) => {
  const s1 = useSharedValue(0);
  const s2 = useSharedValue(0);
  const s3 = useSharedValue(0);
  const o1 = useSharedValue(1);
  const o2 = useSharedValue(1);
  const o3 = useSharedValue(1);

  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    s1.value = withTiming(40, { duration: 500 });
    s2.value = withDelay(200, withTiming(40, { duration: 500 }));
    s3.value = withDelay(400, withTiming(40, { duration: 500 }));
    o1.value = withDelay(600, withTiming(0, { duration: 300 }));
    o2.value = withDelay(700, withTiming(0, { duration: 300 }));
    o3.value = withDelay(800, withTiming(0, { duration: 300 }, () => runOnJS(onDone)()));
  }, []);

  const c1 = useAnimatedStyle(() => ({ transform: [{ scale: s1.value }], opacity: o1.value }));
  const c2 = useAnimatedStyle(() => ({ transform: [{ scale: s2.value }], opacity: o2.value }));
  const c3 = useAnimatedStyle(() => ({ transform: [{ scale: s3.value }], opacity: o3.value }));
  const dot = { position: 'absolute' as const, width: 60, height: 60, borderRadius: 30 };

  return (
    <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]} pointerEvents="none">
      <Animated.View style={[dot, { backgroundColor: colors[0] }, c1]} />
      <Animated.View style={[dot, { backgroundColor: colors[1] }, c2]} />
      <Animated.View style={[dot, { backgroundColor: colors[2] }, c3]} />
    </View>
  );
};

/* ── Orbiting Dots (success) ─────────────────────────────── */
const OrbitDots = ({ count = 6 }: { count?: number }) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: 3000, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(rotation);
  }, []);

  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (360 / count) * i;
        const style = useAnimatedStyle(() => {
          const rad = ((rotation.value + angle) * Math.PI) / 180;
          return {
            position: 'absolute',
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: Accent.green,
            transform: [{ translateX: Math.cos(rad) * 100 }, { translateY: Math.sin(rad) * 100 }],
          };
        });
        return <Animated.View key={i} style={style} />;
      })}
    </>
  );
};

/* ── Swipe-to-Pay Track ──────────────────────────────────── */
const TRACK_W = SCREEN_W - 80;
const KNOB_SIZE = 56;
const THRESHOLD = TRACK_W * 0.8;

const SwipeToPay = ({ onSwipe, label }: { onSwipe: () => void; label: string }) => {
  const translateX = useSharedValue(0);
  const triggered = useSharedValue(false);

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      if (triggered.value) return;
      translateX.value = Math.max(0, Math.min(e.translationX, TRACK_W - KNOB_SIZE));
    })
    .onEnd(() => {
      if (translateX.value >= THRESHOLD - KNOB_SIZE) {
        triggered.value = true;
        translateX.value = withTiming(TRACK_W - KNOB_SIZE, { duration: 150 });
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
        runOnJS(onSwipe)();
      } else {
        translateX.value = withSpring(0, { damping: 15 });
      }
    });

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const textOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, TRACK_W * 0.3], [1, 0]),
  }));

  return (
    <View style={styles.swipeTrack}>
      <Animated.Text style={[styles.swipeText, textOpacity]}>{label}</Animated.Text>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.swipeKnob, knobStyle]}>
          <Text style={styles.swipeArrow}>→</Text>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

/* ── Main Pay Screen ─────────────────────────────────────── */
export default function NfcReceiver() {
  const [payload, setPayload] = useState<RLUSDPaymentPayload | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [showWipe, setShowWipe] = useState(false);

  const { provider } = useProvider();
  const { address, isConnected } = useAccount();

  // Scanning rotation for center orb
  const scanRotation = useSharedValue(0);
  const scanRotStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${scanRotation.value % 360}deg` }],
  }));

  useEffect(() => {
    const initNfc = async () => {
      try {
        await NfcManager.start();
        const supported = await NfcManager.isSupported();
        if (!supported) Alert.alert('NFC Error', 'NFC is not supported on this device');
      } catch (e) {
        console.warn('NFC start error:', e);
      }
    };
    initNfc();

    NfcManager.setEventListener(NfcEvents.DiscoverTag, (tag: TagEvent) => {
      if (tag?.ndefMessage?.length) {
        try {
          const text = Ndef.text.decodePayload(tag.ndefMessage[0].payload as unknown as Uint8Array);
          const data = JSON.parse(text);
          if (data.type === 'RLUSD_PAY') {
            setPayload(data);
            setShowWipe(true);
            setPhase('received');
          } else {
            Alert.alert('Invalid Tag', 'This is not an RLUSD payment tag.');
          }
        } catch (err) {
          console.error('Error parsing NDEF:', err);
        }
      }
      NfcManager.unregisterTagEvent().catch(() => 0);
    });

    return () => {
      NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
      NfcManager.cancelTechnologyRequest();
    };
  }, []);

  const startScan = async () => {
    try {
      setPayload(null);
      setTxHash(null);
      setPhase('scanning');
      scanRotation.value = 0;
      scanRotation.value = withRepeat(withTiming(360, { duration: 2000, easing: Easing.linear }), -1, false);
      await NfcManager.registerTagEvent();
      setTimeout(() => {
        NfcManager.unregisterTagEvent().catch(() => 0);
        setPhase((p) => (p === 'scanning' ? 'idle' : p));
        cancelAnimation(scanRotation);
      }, 15000);
    } catch (ex) {
      console.log('NFC error:', ex);
      setPhase('idle');
      cancelAnimation(scanRotation);
      NfcManager.unregisterTagEvent().catch(() => 0);
    }
  };

  const cancelScan = () => {
    NfcManager.unregisterTagEvent().catch(() => 0);
    cancelAnimation(scanRotation);
    setPhase('idle');
  };

  const sendPayment = async () => {
    if (!payload) return;
    if (!isConnected || !provider || !address) {
      Alert.alert('Wallet Not Connected', 'Please connect your wallet on the Home tab first.');
      return;
    }

    try {
      const fromAddress = address.includes(':') ? address.split(':').pop()! : address;
      const data = encodeErc20Transfer(payload.to, payload.amountRaw);

      const hash = await Promise.race([
        provider.request<string>({
          method: 'eth_sendTransaction',
          params: [{ from: fromAddress, to: payload.tokenAddress, data, value: '0x0', gas: '0x1D4C0' }],
        }),
        txTimeoutPromise(60000) // 60 seconds
      ]);

      setTxHash(hash);
      setPhase('success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      fetch(`${SERVER_URL}/api/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txHash: hash, terminal_id: 'term_01' }),
      }).catch((err) => console.warn('Verify call failed:', err));
    } catch (error: any) {
      console.error('Transaction error:', error);
      Alert.alert('Transaction Failed', error?.message || 'Failed to send transaction');
      setPhase('confirm');
    }
  };

  /* ── Phase: Idle ── */
  const renderIdle = () => (
    <View style={styles.centeredFull}>
      <Pressable onPress={startScan}>
        <View style={styles.orbWrap}>
          <View style={StyleSheet.absoluteFill}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                <PulseRing delay={i * 800} color={Accent.blue} />
              </View>
            ))}
          </View>
          <View style={styles.idleOrb}>
            <Text style={styles.orbNfcText}>NFC</Text>
          </View>
        </View>
      </Pressable>
      <Text style={styles.idleLabel}>Tap to Receive Payment</Text>

      {/* Debug: skip NFC and test full flow with mock data */}
      {ENABLE_DEBUG_FLOW && (
        <Pressable
          style={styles.debugBtn}
          onPress={() => {
            setPayload({
              type: 'RLUSD_PAY',
              tokenAddress: '0xbD84621010fF42EB5bF72872BE6ec6FE67Db546f',
              to: '0x0000000000000000000000000000000000000001',
              amountRaw: '5000000000000000000',
              amountUsd: 5.00,
              chainId: 84532,
            });
            setShowWipe(true);
            setPhase('received');
          }}
        >
          <Text style={styles.debugBtnText}>Debug Flow</Text>
        </Pressable>
      )}
    </View>
  );

  /* ── Phase: Scanning ── */
  const renderScanning = () => (
    <View style={styles.centeredFull}>
      <View style={styles.orbWrap}>
        <View style={StyleSheet.absoluteFill}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
              <PulseRing delay={i * 400} color={Accent.darkSlate} duration={1600} />
            </View>
          ))}
        </View>
        <Animated.View style={[styles.scanningOrb, scanRotStyle]}>
          <Text style={styles.orbNfcText}>NFC</Text>
        </Animated.View>
      </View>
      <Text style={styles.scanningLabel}>Hold near sender...</Text>
      <Pressable style={styles.cancelBtn} onPress={cancelScan}>
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
    </View>
  );

  /* ── Phase: Received / Confirm ── */
  const renderReceived = () => (
    <Animated.View entering={FadeIn.duration(500)} style={styles.centeredFull}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Payment Request</Text>
        <View style={styles.summaryDivider} />
        <Text style={styles.summaryAmountLabel}>Amount</Text>
        <Text style={styles.summaryAmount}>${payload!.amountUsd.toFixed(2)}</Text>
      </View>

      {phase === 'confirm' ? null : (
        <Pressable
          style={styles.confirmBtnContainer}
          onPress={() => setPhase('confirm')}
        >
          <Text style={styles.confirmBtnText}>Review & Pay</Text>
        </Pressable>
      )}

      {phase === 'confirm' && (
        <Animated.View entering={FadeIn.duration(300)} style={{ width: '100%', paddingHorizontal: 16 }}>
          <SwipeToPay onSwipe={sendPayment} label={`Slide to Pay $${payload!.amountUsd.toFixed(2)}`} />
        </Animated.View>
      )}
    </Animated.View>
  );

  /* ── Phase: Success ── */
  const renderSuccess = () => (
    <Animated.View entering={FadeIn.duration(600)} style={styles.centeredFull}>
      <View style={styles.orbWrap}>
        <OrbitDots />
        <View style={styles.successOrb}>
          <Text style={styles.successCheck}>✓</Text>
        </View>
      </View>
      <Text style={styles.successTitle}>Payment Sent!</Text>
      {txHash && (
        <Text style={styles.txHashText} numberOfLines={1} ellipsizeMode="middle">{txHash}</Text>
      )}
      <Pressable style={styles.newPaymentBtn} onPress={() => { setPhase('idle'); setPayload(null); setTxHash(null); }}>
        <Text style={styles.newPaymentText}>New Payment</Text>
      </Pressable>
    </Animated.View>
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      {phase === 'idle' && renderIdle()}
      {phase === 'scanning' && renderScanning()}
      {(phase === 'received' || phase === 'confirm') && payload && renderReceived()}
      {phase === 'success' && renderSuccess()}

      {showWipe && (
        <Wipe
          colors={['#000000', Accent.purple, Accent.green]}
          onDone={() => setShowWipe(false)}
        />
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Accent.surface,
    paddingTop: 50,
  },
  centeredFull: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  /* ── Pulse ring base ── */
  pulseRingBase: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
  },

  /* ── Orb shared ── */
  orbWrap: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  idleOrb: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Accent.blue,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Accent.blue,
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  scanningOrb: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#162033',
    borderWidth: 2,
    borderColor: Accent.blue,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Accent.blue,
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  orbNfcText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 28,
  },
  idleLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: Accent.textSecondary,
  },
  scanningLabel: {
    fontSize: 18,
    color: Accent.textSecondary,
    marginBottom: 16,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  cancelText: {
    color: Accent.red,
    fontSize: 16,
    fontWeight: '600',
  },

  /* ── Summary card ── */
  summaryCard: {
    width: '100%',
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: Accent.blue,
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Accent.textPrimary,
    marginBottom: 12,
  },
  summaryDivider: {
    width: '60%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: Accent.muted,
    marginBottom: 16,
  },
  summaryAmountLabel: {
    fontSize: 13,
    color: Accent.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: Accent.green,
  },
  confirmBtnContainer: {
    backgroundColor: Accent.blue,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  /* ── Swipe to pay ── */
  swipeTrack: {
    width: SCREEN_W - 80,
    height: 64,
    borderRadius: 32,
    backgroundColor: Accent.darkSlate,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  swipeText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    color: Accent.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  swipeKnob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  swipeArrow: {
    fontSize: 22,
    fontWeight: '700',
    color: Accent.blue,
  },

  /* ── Success ── */
  successOrb: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Accent.green,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Accent.green,
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  successCheck: {
    fontSize: 64,
    color: '#fff',
    fontWeight: '800',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Accent.green,
    marginBottom: 8,
  },
  txHashText: {
    fontSize: 12,
    color: Accent.textSecondary,
    fontFamily: 'monospace',
    marginBottom: 24,
    maxWidth: SCREEN_W - 80,
  },
  newPaymentBtn: {
    backgroundColor: Accent.card,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 24,
  },
  newPaymentText: {
    color: Accent.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },

  /* ── Debug ── */
  debugBtn: {
    marginTop: 24,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Accent.purple,
    borderStyle: 'dashed',
  },
  debugBtnText: {
    color: Accent.purple,
    fontSize: 13,
    fontWeight: '600',
  },
});