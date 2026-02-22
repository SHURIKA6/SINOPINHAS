import { View, Text, TouchableOpacity, Image, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { styled } from 'nativewind';
import * as ImagePicker from 'expo-image-picker';
import { uploadVideo } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouch = styled(TouchableOpacity);
const StyledInput = styled(TextInput);
const StyledImage = styled(Image);

export default function UploadFeed() {
    const [media, setMedia] = useState(null);
    const [caption, setCaption] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const pickMedia = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            setMedia(result.assets[0]);
        }
    };

    const handleUpload = async () => {
        if (!media) return;
        setLoading(true);

        try {
            await uploadVideo(media, caption);
            router.replace('/');
        } catch (e) {
            alert('Erro ao enviar post');
            console.log(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <StyledView className="flex-1 bg-[#0E2A47] p-5">
            <StyledView className="items-center mt-10 mb-5">
                <StyledText className="text-white text-xl font-bold">Novo Post</StyledText>
            </StyledView>

            {media ? (
                <StyledView className="flex-1 items-center">
                    <StyledImage source={{ uri: media.uri }} className="w-full h-3/4 rounded-xl mb-4" resizeMode="contain" />
                    <StyledInput
                        className="bg-gray-800 text-white p-3 rounded-lg w-full mb-4"
                        placeholder="Legenda do post..."
                        placeholderTextColor="#666"
                        value={caption}
                        onChangeText={setCaption}
                    />
                    <StyledTouch
                        className="w-full"
                        onPress={handleUpload}
                        disabled={loading}
                    >
                        <LinearGradient
                            colors={['#3b82f6', '#2563eb']}
                            style={{ padding: 15, borderRadius: 12, alignItems: 'center' }}
                        >
                            {loading ? <ActivityIndicator color="#fff" /> : <StyledText className="text-white font-bold">Publicar no Feed</StyledText>}
                        </LinearGradient>
                    </StyledTouch>
                    <StyledTouch onPress={() => setMedia(null)} className="mt-4">
                        <StyledText className="text-gray-400">Escolher outro</StyledText>
                    </StyledTouch>
                </StyledView>
            ) : (
                <StyledView className="flex-1 justify-center items-center">
                    <StyledTouch
                        className="bg-gray-800 p-10 rounded-full border-2 border-dashed border-gray-600 mb-6"
                        onPress={pickMedia}
                    >
                        <Ionicons name="image" size={50} color="white" />
                    </StyledTouch>
                    <StyledText className="text-gray-400 text-center">
                        Toque para selecionar foto ou vídeo para o Feed
                    </StyledText>
                </StyledView>
            )}

            <StyledTouch className="absolute top-10 right-5" onPress={() => router.back()}>
                <Ionicons name="close" size={30} color="white" />
            </StyledTouch>
        </StyledView>
    );
}
