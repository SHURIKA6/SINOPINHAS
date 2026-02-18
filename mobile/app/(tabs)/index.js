import { View, Text, TouchableOpacity, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { styled } from 'nativewind';
import { Heart, MessageCircle, Share2, PlusSquare } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { fetchVideos, fetchStories, viewStory } from '../../services/api';
import Stories from '../../components/Stories';
import StoryViewer from '../../components/StoryViewer';
import { ResizeMode, Video } from 'expo-av';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouch = styled(TouchableOpacity);

const { width } = Dimensions.get('window');

export default function Home() {
    const { user } = useAuth();
    const [videos, setVideos] = useState([]);
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [viewingStoryGroup, setViewingStoryGroup] = useState(null);
    const router = useRouter();

    const loadData = async () => {
        try {
            const [vids, storyData] = await Promise.all([
                fetchVideos(1, 10),
                fetchStories()
            ]);
            setVideos(vids);
            setStories(storyData);
        } catch (e) {
            console.log('Error loading home data', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handleStoryClick = (group) => {
        setViewingStoryGroup(group);
    };

    const handleStoryViewed = async (userId, storyId) => {
        setStories(prev => prev.map(group => {
            if (group.user_id === userId) {
                const updatedStories = group.stories.map(s =>
                    s.id === storyId ? { ...s, viewed: true } : s
                );
                return { ...group, stories: updatedStories, all_viewed: updatedStories.every(s => s.viewed) };
            }
            return group;
        }));
        try {
            await viewStory(storyId);
        } catch (e) { }
    };

    if (viewingStoryGroup) {
        return (
            <StoryViewer
                group={viewingStoryGroup}
                onStoryViewed={handleStoryViewed}
                onClose={() => setViewingStoryGroup(null)}
            />
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-[#0f0d15]" edges={['top']}>
            <StatusBar style="light" />

            {/* Header */}
            <StyledView className="px-4 py-3 flex-row justify-between items-center bg-[#0f0d15]/90 border-b border-white/5">
                <StyledText className="text-white text-2xl font-bold tracking-tighter">SINOPINHAS</StyledText>
                <StyledView className="flex-row gap-4 items-center">
                    {user && (
                        <StyledTouch onPress={() => router.push('(tabs)/upload')}>
                            <PlusSquare size={24} color="white" />
                        </StyledTouch>
                    )}
                    <MessageCircle size={24} color="white" />
                </StyledView>
            </StyledView>

            <ScrollView
                contentContainerStyle={{ paddingBottom: 80 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Stories */}
                {stories && stories.length > 0 && (
                    <Stories stories={stories} onStoryClick={handleStoryClick} />
                )}

                {/* Videos/Posts */}
                {videos && videos.length > 0 ? (
                    videos.map((video, idx) => (
                        <StyledView key={video.id || idx} className="bg-black mb-2 border-b border-white/5">
                            <Video
                                source={{ uri: video.url }}
                                rate={1.0}
                                volume={1.0}
                                isMuted={false}
                                resizeMode={ResizeMode.CONTAIN}
                                useNativeControls
                                style={{ width, height: width * 1.5 }}
                            />
                            <StyledView className="p-4">
                                <StyledView className="flex-row items-center mb-3">
                                    <StyledText className="text-white font-bold">{video.creator}</StyledText>
                                    <StyledText className="text-gray-400 ml-2">@{video.username}</StyledText>
                                </StyledView>
                                <StyledText className="text-white mb-4">{video.caption}</StyledText>
                                <StyledView className="flex-row gap-6">
                                    <StyledView className="flex-row items-center gap-2">
                                        <Heart size={20} color="#f91880" />
                                        <StyledText className="text-gray-400">{video.likes}</StyledText>
                                    </StyledView>
                                    <StyledView className="flex-row items-center gap-2">
                                        <MessageCircle size={20} color="#666" />
                                        <StyledText className="text-gray-400">{video.comments}</StyledText>
                                    </StyledView>
                                    <StyledView className="flex-row items-center gap-2">
                                        <Share2 size={20} color="#666" />
                                        <StyledText className="text-gray-400">{video.shares}</StyledText>
                                    </StyledView>
                                </StyledView>
                            </StyledView>
                        </StyledView>
                    ))
                ) : (
                    <StyledView className="items-center justify-center py-20">
                        <StyledText className="text-gray-400">Nenhum vídeo disponível</StyledText>
                    </StyledView>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
