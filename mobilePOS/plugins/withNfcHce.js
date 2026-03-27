const { withAndroidManifest } = require('@expo/config-plugins');

const withNfcHce = (config) => {
    return withAndroidManifest(config, async (config) => {
        const androidManifest = config.modResults.manifest;

        // Add NFC permission
        if (!androidManifest['uses-permission']) {
            androidManifest['uses-permission'] = [];
        }

        const hasNfcPermission = androidManifest['uses-permission'].some(
            (perm) => perm.$['android:name'] === 'android.permission.NFC'
        );

        if (!hasNfcPermission) {
            androidManifest['uses-permission'].push({
                $: { 'android:name': 'android.permission.NFC' },
            });
        }

        // Add NFC Features
        if (!androidManifest['uses-feature']) {
            androidManifest['uses-feature'] = [];
        }

        const features = [
            { $: { 'android:name': 'android.hardware.nfc', 'android:required': 'true' } },
            { $: { 'android:name': 'android.hardware.nfc.hce', 'android:required': 'true' } }
        ];

        features.forEach(feature => {
            const hasFeature = androidManifest['uses-feature'].some(
                (f) => f.$['android:name'] === feature.$['android:name']
            );
            if (!hasFeature) {
                androidManifest['uses-feature'].push(feature);
            }
        });

        // Get the main application node
        const mainApplication = androidManifest.application[0];
        if (!mainApplication.service) {
            mainApplication.service = [];
        }

        // Check if the service is already added
        const hasService = mainApplication.service.some(
            (s) => s.$['android:name'] === 'com.reactnativehce.services.CardService'
        );

        if (!hasService) {
            // Add the HostApduService definition expected by react-native-hce
            mainApplication.service.push({
                $: {
                    'android:name': 'com.reactnativehce.services.CardService',
                    'android:exported': 'true',
                    'android:permission': 'android.permission.BIND_NFC_SERVICE',
                },
                'intent-filter': [
                    {
                        action: [
                            {
                                $: { 'android:name': 'android.nfc.cardemulation.action.HOST_APDU_SERVICE' },
                            },
                        ],
                        category: [
                            {
                                $: { 'android:name': 'android.intent.category.DEFAULT' }
                            }
                        ]
                    },
                ],
                'meta-data': [
                    {
                        $: {
                            'android:name': 'android.nfc.cardemulation.host_apdu_service',
                            'android:resource': '@xml/apdu_service',
                        },
                    },
                ],
            });
        }

        return config;
    });
};

module.exports = withNfcHce;
