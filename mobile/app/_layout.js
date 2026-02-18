import { useAuth } from '../context/AuthContext';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

export default function Layout() {
    const { user, loading } = useAuth();

    if (loading) {
        return null;
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#0f0d15' }}>
            <StatusBar style="light" backgroundColor="#0f0d15" />
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: '#0f0d15' },
                    animationEnabled: false,
                }}
            >
                {!user ? (
                    <Stack.Screen
                        name="(auth)"
                        options={{
                            headerShown: false,
                            animationEnabled: false,
                        }}
                    />
                ) : (
                    <Stack.Screen
                        name="(tabs)"
                        options={{
                            headerShown: false,
                            animationEnabled: false,
                        }}
                    />
                )}
            </Stack>
        </View>
    );
}
