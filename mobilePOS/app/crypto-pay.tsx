import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { io } from 'socket.io-client';
import { HCESession, NFCTagType4, NFCTagType4NDEFContentType } from 'react-native-hce';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withDelay,
    Easing,
    cancelAnimation,
    runOnJS
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';

type PaymentStep = 'idle' | 'summary' | 'processing' | 'transition_ready' | 'ready' | 'completed';

const SOCKET_URL = 'http://10.104.84.121:3001';

// 1. Pulser for Idle
const IdlePulser = () => {
    return (
        <View style={StyleSheet.absoluteFill}>
            {[0, 1, 2].map((i) => <PulseRing key={i} delay={i * 800} duration={2400} />)}
        </View>
    );
};

const PulseRing = ({ delay, duration }: { delay: number, duration: number }) => {
    const scale = useSharedValue(0.5);
    const opacity = useSharedValue(0.8);

    useEffect(() => {
        const easing = Easing.out(Easing.quad);
        scale.value = withDelay(delay, withRepeat(withTiming(3, { duration, easing }), -1, false));
        opacity.value = withDelay(delay, withRepeat(withTiming(0, { duration, easing }), -1, false));
        return () => { cancelAnimation(scale); cancelAnimation(opacity); };
    }, [delay, duration, scale, opacity]);

    const style = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    return <Animated.View style={[styles.pulseRing, { borderColor: '#007AFF' }, style]} />;
};

// 2. Processing enlargening rings
const ProcessingRings = () => {
    return (
        <View style={StyleSheet.absoluteFill}>
            {[0, 1, 2].map((i) => <ProcessingRing key={i} delay={i * 400} duration={1200} />)}
        </View>
    );
};

const ProcessingRing = ({ delay, duration }: { delay: number, duration: number }) => {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    useEffect(() => {
        const easing = Easing.inOut(Easing.ease);
        scale.value = withDelay(delay, withRepeat(withTiming(4, { duration, easing }), -1, false));
        opacity.value = withDelay(delay, withRepeat(withTiming(0, { duration, easing }), -1, false));
        return () => { cancelAnimation(scale); cancelAnimation(opacity); };
    }, [delay, duration, scale, opacity]);

    const style = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    return <Animated.View style={[styles.pulseRing, { borderColor: '#1E293B', borderWidth: 8 }, style]} />;
};

// 3. Transition Overlay to Ready
const TransitionToReady = ({ onComplete }: { onComplete: () => void }) => {
    const s1 = useSharedValue(0);
    const s2 = useSharedValue(0);
    const s3 = useSharedValue(0);
    const opacity = useSharedValue(1);

    useEffect(() => {
        const duration = 500;
        const targetScale = Dimensions.get('window').height / 30; // Scale enough to cover screen

        s1.value = withTiming(targetScale, { duration, easing: Easing.inOut(Easing.ease) });
        s2.value = withDelay(200, withTiming(targetScale, { duration, easing: Easing.inOut(Easing.ease) }));
        s3.value = withDelay(400, withTiming(targetScale, { duration, easing: Easing.inOut(Easing.ease) }, (finished) => {
            if (finished) {
                opacity.value = withTiming(0, { duration: 300 }, () => {
                    runOnJS(onComplete)();
                });
            }
        }));
    }, [s1, s2, s3, opacity, onComplete]);

    const s1Style = useAnimatedStyle(() => ({ transform: [{ scale: s1.value }], opacity: opacity.value }));
    const s2Style = useAnimatedStyle(() => ({ transform: [{ scale: s2.value }], opacity: opacity.value }));
    const s3Style = useAnimatedStyle(() => ({ transform: [{ scale: s3.value }], opacity: opacity.value }));

    return (
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', zIndex: 100 }]}>
            <Animated.View style={[{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#000000', position: 'absolute' }, s1Style]} />
            <Animated.View style={[{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#440a61', position: 'absolute' }, s2Style]} />
            <Animated.View style={[{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#2fbe4e', position: 'absolute' }, s3Style]} />
        </View>
    );
};

// 4. Rotating dotted circles for Ready
const ReadyCircles = () => {
    const rotation = useSharedValue(0);

    useEffect(() => {
        rotation.value = withRepeat(withTiming(360, { duration: 4000, easing: Easing.linear }), -1, false);
        return () => cancelAnimation(rotation);
    }, [rotation]);

    const style1 = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));
    const style2 = useAnimatedStyle(() => ({ transform: [{ rotate: `-${rotation.value * 1.5}deg` }] }));

    return (
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
            <Animated.View style={[styles.dottedCircle, { borderColor: '#FF2D55', width: 220, height: 220, borderRadius: 110, borderWidth: 2 }, style1]} />
            <Animated.View style={[styles.dottedCircle, { borderColor: '#AF52DE', width: 260, height: 260, borderRadius: 130, borderWidth: 2 }, style2]} />
            <Animated.View style={[styles.dottedCircle, { borderColor: '#0A84FF', width: 300, height: 300, borderRadius: 150, borderWidth: 2 }, style1]} />
        </View>
    );
};

// 5. Completed Animation
const CompletedCircles = () => {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    useEffect(() => {
        scale.value = withTiming(3, { duration: 1000, easing: Easing.out(Easing.exp) });
        opacity.value = withTiming(0, { duration: 1000, easing: Easing.out(Easing.exp) });
    }, [scale, opacity]);

    const style = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    return (
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
            <Animated.View style={[styles.dottedCircle, { borderColor: '#34C759', width: 220, height: 220, borderRadius: 110, borderWidth: 8 }, style]} />
        </View>
    );
};

// 6. Swipe To Pay Component
const SWIPE_WIDTH = 260;
const KNOB_SIZE = 56;
const MAX_TRANSLATE = SWIPE_WIDTH - KNOB_SIZE - 4; // slight padding

const SwipeToPayButton = ({ onSwipeSuccess }: { onSwipeSuccess: () => void }) => {
    const translateX = useSharedValue(0);

    const pan = Gesture.Pan()
        .onUpdate((event) => {
            translateX.value = Math.max(0, Math.min(event.translationX, MAX_TRANSLATE));
        })
        .onEnd(() => {
            if (translateX.value > MAX_TRANSLATE * 0.75) {
                translateX.value = withTiming(MAX_TRANSLATE, { duration: 200 }, () => {
                    runOnJS(onSwipeSuccess)();
                });
            } else {
                translateX.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.back(1.5)) });
            }
        });

    const knobStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }]
    }));

    const textStyle = useAnimatedStyle(() => ({
        opacity: 1 - (translateX.value / MAX_TRANSLATE),
        transform: [{ translateX: translateX.value * 0.2 }] // Slight parallax
    }));

    return (
        <View style={[styles.swipeContainer, { width: SWIPE_WIDTH }]}>
            <Animated.Text style={[styles.swipeText, textStyle]}>Slide to Pay</Animated.Text>
            <GestureDetector gesture={pan}>
                <Animated.View style={[styles.swipeKnob, knobStyle]}>
                    <Ionicons name="chevron-forward" size={32} color="#0A84FF" />
                </Animated.View>
            </GestureDetector>
        </View>
    );
};

export default function CryptoPayScreen() {
    const [step, setStep] = useState<PaymentStep>('idle');
    const [paymentData, setPaymentData] = useState<any>(null);
    const [hceSession, setHceSession] = useState<HCESession | null>(null);
    const { terminal_id = 'term_01' } = useLocalSearchParams<{ terminal_id: string }>();

    useEffect(() => {
        const newSocket = io(SOCKET_URL);

        newSocket.on('connect', () => {
            console.log('Connected to backend:', newSocket.id);
            newSocket.emit('join_terminal', terminal_id);
        });

        newSocket.on('payment_intent', (data) => {
            console.log('Received payment intent:', data);
            setPaymentData(data);
            setStep('summary');
        });

        newSocket.on('payment_success', (data) => {
            console.log('Payment successful:', data);
            setStep('completed');
        });

        return () => {
            newSocket.disconnect();
        };
    }, [terminal_id]);

    const stopNfcBroadcast = async () => {
        try {
            if (hceSession) {
                await hceSession.setEnabled(false);
            }
        } catch (error) {
            console.error('Error stopping NFC broadcast:', error);
        }
    };

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;
        if (step === 'processing') {
            timeout = setTimeout(() => {
                setStep('transition_ready');
            }, 2500);
        } else if (step === 'ready' && paymentData) {
            startNfcBroadcast(paymentData);
        } else if (step === 'completed') {
            stopNfcBroadcast();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        return () => {
            clearTimeout(timeout);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, paymentData, hceSession]);

    const startNfcBroadcast = async (data: any) => {
        try {
            const payloadString = JSON.stringify(data);
            const tag = new NFCTagType4({
                type: NFCTagType4NDEFContentType.Text,
                content: payloadString,
                writable: false
            });
            const session = await HCESession.getInstance();
            await session.setApplication(tag);
            await session.setEnabled(true);
            setHceSession(session);
        } catch (error) {
            console.error('Error starting NFC broadcast:', error);
        }
    };

    const handlePayPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setTimeout(() => setStep('processing'), 300); // small delay to let swipe finish
    };
    const handleTapToPay = () => setStep('completed');

    const renderIdle = () => (
        <View style={styles.centerContent}>
            <View style={{ position: 'relative', width: 160, height: 160, justifyContent: 'center', alignItems: 'center' }}>
                <IdlePulser />
                <View style={[styles.logoContainer, { zIndex: 10 }]}>
                    <Image source={{ uri: 'https://cryptologos.cc/logos/xrp-xrp-logo.png' }} style={styles.rippleLogo} contentFit="contain" />
                </View>
            </View>
        </View>
    );

    const renderSummary = () => (
        <View style={[styles.centerContent, { padding: 0 }]}>
            <View style={styles.summaryContainer}>
                <Text style={styles.title}>Order Summary</Text>
                <View style={styles.card}>
                    <Text style={styles.itemName}>Sweet Treats Order</Text>
                    <Text style={styles.price}>${paymentData?.amountUsd?.toFixed(2) || '0.00'}</Text>
                </View>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalAmount}>${paymentData?.amountUsd?.toFixed(2) || '0.00'}</Text>
                </View>

                <View style={{ width: '100%', alignItems: 'center', marginTop: 10 }}>
                    <SwipeToPayButton onSwipeSuccess={handlePayPress} />
                </View>

                {/* Temporary Dev Button */}
                <TouchableOpacity style={{ marginTop: 32, alignSelf: 'center', padding: 12 }} onPress={() => setStep('idle')}>
                    <Text style={{ color: '#999', fontSize: 16, fontWeight: '500' }}>Cancel (Dev)</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderProcessing = () => (
        <View style={styles.centerContent}>
            <ProcessingRings />
            <Text style={[styles.statusText, { color: '#1E293B' }]}>Initializing Payment...</Text>
            <View style={styles.logoContainerDark}>
                <Image source={{ uri: 'https://cryptologos.cc/logos/xrp-xrp-logo.png' }} style={styles.rippleLogoDark} contentFit="contain" />
            </View>
            <Text style={styles.subText}>Generating secure link...</Text>
        </View>
    );

    const renderTransitionToReady = () => (
        <TransitionToReady onComplete={() => setStep('ready')} />
    );

    const renderReady = () => {
        const textOffsetY = Dimensions.get('window').height * 0.15;
        return (
            <TouchableOpacity style={styles.centerContent} onPress={handleTapToPay} activeOpacity={0.8}>
                <ReadyCircles />
                <Text style={[styles.statusText, { position: 'absolute', top: textOffsetY }]}>Ready to Pay</Text>
                <View style={[styles.circle, styles.greenCircle, { position: 'absolute' }]}>
                    <Ionicons name="card-outline" size={60} color="#ffffff" />
                </View>
                <Text style={[styles.subText, { position: 'absolute', bottom: textOffsetY }]}>Tap phone to terminal</Text>
            </TouchableOpacity>
        );
    };

    const renderCompleted = () => (
        <View style={styles.centerContent}>
            <CompletedCircles />
            <Text style={[styles.statusText, { zIndex: 10 }]}>Payment Successful!</Text>
            <View style={[styles.circle, styles.completedCircle, { zIndex: 10, marginVertical: 40 }]}>
                <Ionicons name="checkmark" size={80} color="#ffffff" />
            </View>
            <Text style={[styles.subText, { zIndex: 10, marginTop: 0 }]}>Transaction confirmed on ledger.</Text>
            <TouchableOpacity
                style={[styles.payButton, { marginTop: 60, width: '80%', paddingHorizontal: 32, zIndex: 10 }]}
                onPress={() => {
                    setStep('idle');
                    router.back();
                }}
            >
                <Text style={styles.payButtonText}>Done</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={styles.container}>
                {step === 'idle' && renderIdle()}
                {step === 'summary' && renderSummary()}
                {step === 'processing' && renderProcessing()}
                {step === 'transition_ready' && renderTransitionToReady()}
                {step === 'ready' && renderReady()}
                {step === 'completed' && renderCompleted()}

                {/* Invisible Dev Button to simulate socket event */}
                {step === 'idle' && (
                    <TouchableOpacity
                        style={{ position: 'absolute', bottom: 40, right: 20, width: 60, height: 60 }}
                        onPress={() => setStep('summary')}
                        activeOpacity={0}
                    />
                )}
            </View>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FCFCFC',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 16,
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
    },
    logoContainerDark: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: '#1E293B',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 16,
        shadowColor: '#1E293B',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
        zIndex: 10,
    },
    rippleLogo: {
        width: 90,
        height: 90,
    },
    rippleLogoDark: {
        width: 90,
        height: 90,
        tintColor: '#ffffff'
    },
    pulseRing: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 160,
        height: 160,
        marginLeft: -80,
        marginTop: -80,
        borderRadius: 80,
        borderWidth: 4,
    },
    summaryContainer: {
        width: '85%',
        backgroundColor: 'rgba(235, 248, 255, 0.95)',
        padding: 30,
        borderRadius: 24,
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 32,
        color: '#1a1a1a',
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 4,
    },
    itemName: {
        fontSize: 18,
        color: '#333',
        fontWeight: '600',
    },
    price: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 24,
        borderTopWidth: 1,
        borderTopColor: '#ddd',
        marginBottom: 32,
    },
    totalLabel: {
        fontSize: 22,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    totalAmount: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    swipeContainer: {
        height: KNOB_SIZE + 8,
        backgroundColor: '#D1E8FF',
        borderRadius: (KNOB_SIZE + 8) / 2,
        justifyContent: 'center',
        overflow: 'hidden',
    },
    swipeText: {
        position: 'absolute',
        width: '100%',
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0A84FF',
        zIndex: 1,
    },
    swipeKnob: {
        width: KNOB_SIZE,
        height: KNOB_SIZE,
        borderRadius: KNOB_SIZE / 2,
        backgroundColor: '#FFFFFF',
        position: 'absolute',
        left: 4,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    statusText: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 40,
        color: '#1a1a1a',
        zIndex: 10,
    },
    subText: {
        fontSize: 18,
        fontWeight: '500',
        color: '#666',
        marginTop: 40,
        zIndex: 10,
    },
    circle: {
        width: 160,
        height: 160,
        borderRadius: 80,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        zIndex: 10,
    },
    greenCircle: {
        backgroundColor: '#34C759',
    },
    completedCircle: {
        backgroundColor: '#34C759',
    },
    dottedCircle: {
        position: 'absolute',
        borderStyle: 'dashed',
    },
    payButton: {
        backgroundColor: '#0A84FF',
        paddingVertical: 20,
        borderRadius: 100,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#0A84FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    payButtonText: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: 'bold',
    },
});
