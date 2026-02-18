import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { styled } from 'nativewind';
import * as ImagePicker from 'expo-image-picker';
import { Upload, X } from 'lucide-react-native';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouch = styled(TouchableOpacity);

export default function UploadScreen() {
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [caption, setCaption] = useState('');
    const [loading, setLoading] = useState(false);

    const pickVideo = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                allowsEditing: true,
                aspect: [9, 16],
                quality: 1,
            });

            if (!result.cancelled) {
                setSelectedVideo(result.assets[0]);
            }
        } catch (err) {
            Alert.alert('Erro', 'Falha ao selecionar vídeo');
        }
    };

    const handleUpload = async () => {
        if (!selectedVideo || !caption.trim()) {
            Alert.alert('Preencha todos os campos');
            return;
        }

        setLoading(true);
        try {
            // TODO: Implementar upload
            Alert.alert('Sucesso', 'Vídeo enviado!');
            setSelectedVideo(null);
            setCaption('');
        } catch (err) {
            Alert.alert('Erro', 'Falha ao enviar vídeo');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[#0f0d15]">
            <StatusBar style="light" />

            <StyledView className="px-4 py-4 border-b border-white/5">
                <StyledText className="text-white text-2xl font-bold">Novo Vídeo</StyledText>
            </StyledView>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
                {selectedVideo ? (
                    <StyledView className="bg-black rounded-xl mb-4 h-64 items-center justify-center relative">
                        <Upload size={48} color="#666" />
                        <StyledText className="text-gray-400 mt-2">Vídeo selecionado</StyledText>
                        <StyledTouch
                            onPress={() => setSelectedVideo(null)}
                            className="absolute top-2 right-2 bg-red-500 p-2 rounded-full"
                        >
                            <X size={24} color="white" />
                        </StyledTouch>
                    </StyledView>
                ) : (
                    <StyledTouch
                        onPress={pickVideo}
                        className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-xl mb-4 h-64 items-center justify-center"
                    >
                        <Upload size={48} color="#666" />
                        <StyledText className="text-gray-400 mt-2">Selecione um vídeo</StyledText>
                    </StyledTouch>
                )}

                <StyledView className="mb-4">
                    <StyledText className="text-gray-400 mb-2">Descrição</StyledText>
                    <View
                        className="bg-gray-800 rounded-xl p-4 border border-gray-700"
                        style={{ minHeight: 120 }}
                    >
                        <Text
                            style={{
                                color: caption ? 'white' : '#666',
                                fontSize: 16,
                            }}
                            onChangeText={(text) => setCaption(text)}
                        >
                            {caption || 'Descreva seu vídeo...'}
                        </Text>
                    </View>
                </StyledView>

                <StyledTouch
                    onPress={handleUpload}
                    disabled={loading || !selectedVideo}
                    className="bg-blue-500 p-4 rounded-xl"
                    style={{ opacity: loading || !selectedVideo ? 0.5 : 1 }}
                >
                    <StyledText className="text-white text-center font-bold text-lg">
                        {loading ? 'Enviando...' : 'Publicar'}
                    </StyledText>
                </StyledTouch>
            </ScrollView>
        </SafeAreaView>
    );
}
