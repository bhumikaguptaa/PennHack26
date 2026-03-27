import React, { useEffect, useState, useRef } from 'react';
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
import { Accent } from '@/constants/theme';

// ── TRON types ──
import { TronSwapPayload } from '@/utils/tronTxBuilder';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Feature flag — mirrors backend's USE_TRON ──
// Set to true to use TRON path, false for Base Sepolia ERC-20
const USE_TRON = true;

// --- Types ---
interface RLUSDPaymentPayload {
  type: 'RLUSD_PAY';
  tokenAddress: string;
  to: string;
  amountRaw: string;
  amountUsd: number;
  chainId: number;
}

type PaymentPayload = TronSwapPayload | RLUSDPaymentPayload;

function isTronPayload(p: PaymentPayload): p is TronSwapPayload {
  return 'payment_amt' in p && 'source_currency' in p;
}

const ERC20_TRANSFER_SELECTOR = '0xa9059cbb';
function encodeErc20Transfer(to: string, amountRaw: string): string {
  const paddedAddress = to.slice(2).toLowerCase().padStart(64, '0');
  const amountHex = BigInt(amountRaw).toString(16).padStart(64, '0');
  return `${ERC20_TRANSFER_SELECTOR}${paddedAddress}${amountHex}`;
}

const SERVER_URL = "http://10.0.0.129:3001";
const ENABLE_DEBUG_FLOW = false;

type Phase = 'idle' | 'scanning' | 'received' | 'confirm' | 'signing' | 'success';

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
  const [payload, setPayload] = useState<PaymentPayload | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [showWipe, setShowWipe] = useState(false);

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

          // ── Detect payload type ──
          if (USE_TRON && data.payment_amt && data.source_currency) {
            // TRON DEX swap payload
            const tronPayload: TronSwapPayload = {
              payment_amt: data.payment_amt,
              payment_amt_trx: data.payment_amt_trx,
              source_currency: data.source_currency,
              destination_currency: data.destination_currency,
              destination_wallet: data.destination_wallet,
            };
            setPayload(tronPayload);
            setShowWipe(true);
            setPhase('received');
          } else if (data.type === 'RLUSD_PAY') {
            // Old Base Sepolia ERC-20 payload
            setPayload(data as RLUSDPaymentPayload);
            setShowWipe(true);
            setPhase('received');
          } else {
            Alert.alert('Invalid Tag', 'Unrecognized payment tag format.');
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

  // ── TRON payment flow ──
  // Customer swipes → client calls backend → backend executes SunSwap V2 swap
  // USDT goes directly to vendor via the DEX router's `to` parameter
  const sendTronPayment = async () => {
    if (!payload || !isTronPayload(payload)) return;

    try {
      setPhase('signing');

      // Call backend to execute the swap
      const resp = await fetch(`${SERVER_URL}/api/execute-swap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ terminal_id: 'term_01' }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        console.log(data)
        throw new Error(data.error || data.details || 'Swap failed');
      }

      setTxHash(data.txHash);
      setPhase('success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      console.error('TRON swap error:', error);
      Alert.alert('Swap Failed', error?.message || 'Failed to execute TRX → USDT swap');
      setPhase('confirm');
    }
  };

  // ── Base Sepolia payment flow (old — requires AppKit to be loaded) ──
  const sendEvmPayment = async () => {
    if (!payload || isTronPayload(payload)) return;

    // NOTE: This path is only reachable when USE_TRON = false
    // In that case, AppKit must be loaded and provide EVM wallet
    Alert.alert('EVM Flow Disabled', 'Switch USE_TRON to false and restart to use the Base Sepolia flow.');
    setPhase('confirm');
    return;

    /* --- PRESERVED EVM CODE (activate by removing early return above) ---
    try {
      setPhase('signing');
      const fromAddress = '';
      const data = encodeErc20Transfer(payload.to, payload.amountRaw);

      const hash = await Promise.race([
        Promise.reject(new Error('EVM provider not available in TRON mode')),
        txTimeoutPromise(60000),
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
    --- END PRESERVED EVM CODE */
  };

  // ── Unified send handler ──
  const sendPayment = () => {
    if (payload && isTronPayload(payload)) {
      sendTronPayment();
    } else {
      sendEvmPayment();
    }
  };

  // ── Display helpers ──
  const getDisplayAmount = (): string => {
    if (!payload) return '0.00';
    if (isTronPayload(payload)) return `${payload.payment_amt_trx} TRX`;
    return `$${payload.amountUsd.toFixed(2)}`;
  };

  const getSwapInfo = (): string | null => {
    if (!payload || !isTronPayload(payload)) return null;
    return `${payload.payment_amt_trx} TRX → $${payload.payment_amt} USDT`;
  };

  const getExplorerUrl = (): string | null => {
    if (!txHash) return null;
    if (payload && isTronPayload(payload)) {
      return `https://nile.tronscan.org/#/transaction/${txHash}`;
    }
    return `https://sepolia.basescan.org/tx/${txHash}`;
  };

  /* ── Phase: Idle ── */
  const renderIdle = () => (
    <View style={styles.centeredFull}>
      <Pressable onPress={startScan}>
        <View style={styles.orbWrap}>
          <View style={StyleSheet.absoluteFill}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                <PulseRing delay={i * 800} color={USE_TRON ? '#FF0013' : Accent.blue} />
              </View>
            ))}
          </View>
          <View style={[styles.idleOrb, USE_TRON && { backgroundColor: '#FF0013', shadowColor: '#FF0013' }]}>
            <Text style={styles.orbNfcText}>NFC</Text>
          </View>
        </View>
      </Pressable>
      <Text style={styles.idleLabel}>Tap to Receive Payment</Text>
      <Text style={styles.modeLabel}>{USE_TRON ? 'TRON · Nile Testnet' : 'Base Sepolia'}</Text>

      {/* Debug: skip NFC and test full flow with mock data */}
      {ENABLE_DEBUG_FLOW && (
        <Pressable
          style={styles.debugBtn}
          onPress={() => {
            if (USE_TRON) {
              setPayload({
                payment_amt: 50,
                payment_amt_trx: 200,
                source_currency: 'TRX',
                destination_currency: 'USDT',
                destination_wallet: 'TYourVendorAddress',
              } as TronSwapPayload);
            } else {
              setPayload({
                type: 'RLUSD_PAY',
                tokenAddress: '0xbD84621010fF42EB5bF72872BE6ec6FE67Db546f',
                to: '0x0000000000000000000000000000000000000001',
                amountRaw: '5000000000000000000',
                amountUsd: 5.00,
                chainId: 84532,
              });
            }
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
      <Text style={styles.scanningLabel}>Hold near terminal...</Text>
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

        {/* Swap info for TRON */}
        {getSwapInfo() && (
          <View style={styles.swapBadge}>
            <Text style={styles.swapBadgeText}>{getSwapInfo()}</Text>
          </View>
        )}

        <Text style={styles.summaryAmountLabel}>Amount</Text>
        <Text style={styles.summaryAmount}>{getDisplayAmount()}</Text>

        {/* Show destination info for TRON */}
        {payload && isTronPayload(payload) && (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.summaryAmountLabel}>Vendor</Text>
            <Text style={styles.vendorAddress} numberOfLines={1} ellipsizeMode="middle">
              {payload.destination_wallet}
            </Text>
          </View>
        )}
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
          <SwipeToPay onSwipe={sendPayment} label={`Slide to Pay ${getDisplayAmount()}`} />
        </Animated.View>
      )}
    </Animated.View>
  );

  /* ── Phase: Signing (waiting for TronLink / MetaMask) ── */
  const renderSigning = () => (
    <Animated.View entering={FadeIn.duration(400)} style={styles.centeredFull}>
      <View style={styles.orbWrap}>
        <View style={StyleSheet.absoluteFill}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
              <PulseRing delay={i * 600} color={Accent.purple} duration={1800} />
            </View>
          ))}
        </View>
        <View style={[styles.signingOrb]}>
          <Text style={styles.signingIcon}>🔐</Text>
        </View>
      </View>
      <Text style={styles.signingTitle}>Processing Swap...</Text>
      <Text style={styles.signingSubtext}>Swapping TRX → USDT via SunSwap V2</Text>
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
      {phase === 'signing' && renderSigning()}
      {phase === 'success' && renderSuccess()}

      {showWipe && (
        <Wipe
          colors={USE_TRON ? ['#CC0000', '#FF0013', Accent.green] : ['#000000', Accent.purple, Accent.green]}
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
  modeLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Accent.textTertiary,
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
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
  swapBadge: {
    backgroundColor: 'rgba(255, 0, 19, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  swapBadgeText: {
    color: '#FF4444',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  vendorAddress: {
    fontSize: 13,
    color: Accent.textSecondary,
    fontFamily: 'monospace',
    maxWidth: SCREEN_W - 120,
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

  /* ── Signing ── */
  signingOrb: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Accent.purple,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Accent.purple,
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  signingIcon: {
    fontSize: 56,
  },
  signingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Accent.textPrimary,
    marginBottom: 8,
  },
  signingSubtext: {
    fontSize: 14,
    color: Accent.textSecondary,
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