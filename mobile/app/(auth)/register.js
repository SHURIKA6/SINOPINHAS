import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useState } from 'react';
import { Link } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledInput = styled(TextInput);
const StyledTouch = styled(TouchableOpacity);

export default function Register() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signUp } = useAuth();

    const handleRegister = async () => {
        if (!username || !password || !confirmPassword) {
            return alert("Preencha todos os campos!");
        }
        if (password !== confirmPassword) {
            return alert("As senhas não conferem!");
        }
        setLoading(true);
        const result = await signUp(username, password);
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
                    <StyledText className="text-gray-400 text-lg">Crie sua conta</StyledText>
                </StyledView>

                <StyledView className="gap-4">
                    <StyledView>
                        <StyledText className="text-gray-400 mb-2 ml-1">Usuário</StyledText>
                        <StyledInput
                            className="bg-gray-800 text-white p-4 rounded-xl border border-gray-700"
                            placeholder="Escolha seu @username"
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
                            placeholder="Crie uma senha segura"
                            placeholderTextColor="#666"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                            editable={!loading}
                        />
                    </StyledView>

                    <StyledView>
                        <StyledText className="text-gray-400 mb-2 ml-1">Confirmar Senha</StyledText>
                        <StyledInput
                            className="bg-gray-800 text-white p-4 rounded-xl border border-gray-700"
                            placeholder="Confirme sua senha"
                            placeholderTextColor="#666"
                            secureTextEntry
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            editable={!loading}
                        />
                    </StyledView>

                    <StyledTouch
                        onPress={handleRegister}
                        disabled={loading}
                        className="bg-blue-500 p-4 rounded-xl mt-2"
                        style={{ opacity: loading ? 0.5 : 1 }}
                    >
                        <StyledText className="text-white text-center font-bold text-lg">
                            {loading ? 'Registrando...' : 'Registrar'}
                        </StyledText>
                    </StyledTouch>
                </StyledView>

                <StyledView className="flex-row justify-center mt-6">
                    <StyledText className="text-gray-400">Já tem conta? </StyledText>
                    <Link href="/login" asChild>
                        <StyledTouch>
                            <StyledText className="text-blue-400 font-bold">Faça login</StyledText>
                        </StyledTouch>
                    </Link>
                </StyledView>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
