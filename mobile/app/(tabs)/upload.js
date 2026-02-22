import { View, Text, TouchableOpacity, ScrollView, Alert, TextInput, Image } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { styled } from 'nativewind';
import * as ImagePicker from 'expo-image-picker';
import { Upload, X, Image as ImageIcon } from 'lucide-react-native';
import { uploadVideo } from '../../services/api';
import { useRouter } from 'expo-router';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouch = styled(TouchableOpacity);
const StyledInput = styled(TextInput);

export default function UploadScreen() {
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [caption, setCaption] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const pickMedia = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images', 'videos'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled) {
                setSelectedMedia(result.assets[0]);
            }
        } catch (err) {
            Alert.alert('Erro', 'Falha ao selecionar mídia');
        }
    };

    const handleUpload = async () => {
        if (!selectedMedia) {
            Alert.alert('Erro', 'Selecione uma foto ou vídeo');
            return;
        }

        setLoading(true);
        try {
            // Conecta com a função de upload do seu service/api.js
            const result = await uploadVideo(selectedMedia, caption);
            
            Alert.alert('Sucesso', 'Postagem enviada com sucesso!');
            setSelectedMedia(null);
            setCaption('');
            
            // Redireciona para o Feed após o upload
            router.replace('/(tabs)');
        } catch (err) {
            console.log('Upload error:', err);
            Alert.alert('Erro', err.response?.data?.error || 'Falha ao enviar postagem. Verifique sua conexão.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[#0f0d15]">
            <StatusBar style="light" />

            <StyledView className="px-4 py-4 border-b border-white/5">
                <StyledText className="text-white text-2xl font-bold">Nova Postagem</StyledText>
            </StyledView>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
                {selectedMedia ? (
                    <StyledView className="bg-black rounded-xl mb-4 h-80 items-center justify-center relative overflow-hidden">
                        {selectedMedia.type === 'video' ? (
                            <StyledView className="items-center">
                                <Upload size={48} color="#666" />
                                <StyledText className="text-gray-400 mt-2">Vídeo selecionado</StyledText>
                            </StyledView>
                        ) : (
                            <Image 
                                source={{ uri: selectedMedia.uri }} 
                                style={{ width: '100%', height: '100%' }}
                                resizeMode="cover"
                            />
                        )}
                        <StyledTouch
                            onPress={() => setSelectedMedia(null)}
                            className="absolute top-2 right-2 bg-red-500 p-2 rounded-full"
                        >
                            <X size={20} color="white" />
                        </StyledTouch>
                    </StyledView>
                ) : (
                    <StyledTouch
                        onPress={pickMedia}
                        className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-xl mb-4 h-64 items-center justify-center"
                    >
                        <ImageIcon size={48} color="#666" />
                        <StyledText className="text-gray-400 mt-2">Selecione Foto ou Vídeo</StyledText>
                    </StyledTouch>
                )}

                <StyledView className="mb-6">
                    <StyledText className="text-gray-400 mb-2 font-medium">Legenda</StyledText>
                    <StyledInput
                        className="bg-gray-800 text-white p-4 rounded-xl border border-gray-700 text-lg"
                        style={{ minHeight: 100 }}
                        placeholder="Escreva algo sobre sua postagem..."
                        placeholderTextColor="#666"
                        multiline
                        textAlignVertical="top"
                        value={caption}
                        onChangeText={setCaption}
                    />
                </StyledView>

                <StyledTouch
                    onPress={handleUpload}
                    disabled={loading || !selectedMedia}
                    className="bg-blue-500 p-4 rounded-xl flex-row justify-center items-center"
                    style={{ opacity: loading || !selectedMedia ? 0.5 : 1 }}
                >
                    <StyledText className="text-white text-center font-bold text-lg">
                        {loading ? 'Publicando...' : 'Publicar'}
                    </StyledText>
                </StyledTouch>
            </ScrollView>
        </SafeAreaView>
    );
}
