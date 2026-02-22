import { AuthProvider, useAuth } from '../context/AuthContext';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ImageBackground } from 'react-native';

function RootLayoutNav() {
    const { user, loading } = useAuth();

    if (loading) {
        return null;
    }

    return (
        <View style={{ flex: 1 }}>
            {/* Background Aero/Bliss Style */}
            <ImageBackground 
                source={require('../assets/backgrounds/xp-bliss.png')} 
                style={{ flex: 1 }}
                resizeMode="cover"
            >
                <StatusBar style="light" transparent />
                <Stack
                    screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: 'transparent' },
                        animationEnabled: true,
                    }}
                >
                    {!user ? (
                        <Stack.Screen
                            name="(auth)"
                            options={{
                                headerShown: false,
                            }}
                        />
                    ) : (
                        <Stack.Screen
                            name="(tabs)"
                            options={{
                                headerShown: false,
                            }}
                        />
                    )}
                </Stack>
            </ImageBackground>
        </View>
    );
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <RootLayoutNav />
        </AuthProvider>
    );
}
