import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useState } from 'react';
import { Link } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledInput = styled(TextInput);
const StyledTouch = styled(TouchableOpacity);

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();

    const handleLogin = async () => {
        if (!username || !password) return alert("Preencha tudo!");
        setLoading(true);
        const result = await signIn(username, password);
        setLoading(false);
        if (!result.success) {
            alert(result.error);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: '#0E2A47' }}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>
                <StyledView className="items-center mb-10">
                    <StyledText className="text-white text-4xl font-bold mb-2 tracking-tighter">SINOPINHAS</StyledText>
                    <StyledText className="text-gray-400 text-lg">Faça login para continuar</StyledText>
                </StyledView>

                <StyledView className="gap-4">
                    <StyledView>
                        <StyledText className="text-gray-400 mb-2 ml-1">Usuário</StyledText>
                        <StyledInput
                            className="bg-gray-800 text-white p-4 rounded-xl border border-gray-700"
                            placeholder="Seu @username ou email"
                            placeholderTextColor="#666"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                            editable={!loading}
                        />
                    </StyledView>

                    <StyledView>
                        <StyledText className="text-gray-400 mb-2 ml-1">Senha</StyledText>
                        <StyledInput
                            className="bg-gray-800 text-white p-4 rounded-xl border border-gray-700"
                            placeholder="Sua senha"
                            placeholderTextColor="#666"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                            editable={!loading}
                        />
                    </StyledView>

                    <StyledTouch
                        onPress={handleLogin}
                        disabled={loading}
                        className="bg-blue-500 p-4 rounded-xl mt-2"
                        style={{ opacity: loading ? 0.5 : 1 }}
                    >
                        <StyledText className="text-white text-center font-bold text-lg">
                            {loading ? 'Entrando...' : 'Entrar'}
                        </StyledText>
                    </StyledTouch>
                </StyledView>

                <StyledView className="flex-row justify-center mt-6">
                    <StyledText className="text-gray-400">Não tem conta? </StyledText>
                    <Link href="/register" asChild>
                        <StyledTouch>
                            <StyledText className="text-blue-400 font-bold">Registre-se</StyledText>
                        </StyledTouch>
                    </Link>
                </StyledView>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
