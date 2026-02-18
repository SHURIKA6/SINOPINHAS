import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { styled } from 'nativewind';
import { LogOut } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouch = styled(TouchableOpacity);

export default function ProfileScreen() {
    const { user, signOut } = useAuth();

    const handleLogout = async () => {
        const result = await signOut();
        if (!result.success) {
            alert('Erro ao fazer logout');
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[#0f0d15]">
            <StatusBar style="light" />

            <StyledView className="px-4 py-4 border-b border-white/5">
                <StyledText className="text-white text-2xl font-bold">Perfil</StyledText>
            </StyledView>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
                <StyledView className="bg-gray-800 rounded-xl p-6 items-center mb-6">
                    <StyledView className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mb-4" />
                    <StyledText className="text-white text-2xl font-bold">{user?.username}</StyledText>
                    <StyledText className="text-gray-400 mt-1">@{user?.username?.toLowerCase()}</StyledText>
                </StyledView>

                <StyledView className="flex-row gap-4 mb-6">
                    <StyledView className="flex-1 bg-gray-800 rounded-xl p-4 items-center">
                        <StyledText className="text-white text-2xl font-bold">0</StyledText>
                        <StyledText className="text-gray-400 text-sm mt-1">Vídeos</StyledText>
                    </StyledView>
                    <StyledView className="flex-1 bg-gray-800 rounded-xl p-4 items-center">
                        <StyledText className="text-white text-2xl font-bold">0</StyledText>
                        <StyledText className="text-gray-400 text-sm mt-1">Seguidores</StyledText>
                    </StyledView>
                    <StyledView className="flex-1 bg-gray-800 rounded-xl p-4 items-center">
                        <StyledText className="text-white text-2xl font-bold">0</StyledText>
                        <StyledText className="text-gray-400 text-sm mt-1">Seguindo</StyledText>
                    </StyledView>
                </StyledView>

                <StyledTouch
                    onPress={handleLogout}
                    className="bg-red-500/20 border border-red-500 p-4 rounded-xl flex-row items-center justify-center gap-2"
                >
                    <LogOut size={20} color="#ef4444" />
                    <StyledText className="text-red-500 font-bold">Fazer logout</StyledText>
                </StyledTouch>
            </ScrollView>
        </SafeAreaView>
    );
}
