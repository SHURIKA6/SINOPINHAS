import { View, Text, TouchableOpacity, ScrollView, RefreshControl, Image, Dimensions } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { styled } from 'nativewind';
import { Heart, MessageCircle, Share2, Play, PlusSquare } from 'lucide-react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { fetchVideos, fetchStories, viewStory } from '../services/api';
import Stories from '../components/Stories';
import StoryViewer from '../components/StoryViewer';
import { ResizeMode, Video } from 'expo-av';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouch = styled(TouchableOpacity);
const StyledImage = styled(Image);

const { width } = Dimensions.get('window');

export default function Home() {
    const { user, loading: authLoading } = useAuth();
    const [videos, setVideos] = useState([]);
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [viewingStoryGroup, setViewingStoryGroup] = useState(null);
    const router = useRouter();

    const loadData = async () => {
        try {
            const [videosResult, storiesResult] = await Promise.allSettled([
                fetchVideos(1, 10),
                fetchStories()
            ]);

            if (videosResult.status === 'fulfilled') {
                setVideos(videosResult.value || []);
            } else {
                console.log('Error loading videos', videosResult.reason);
                setVideos([]);
            }

            if (storiesResult.status === 'fulfilled') {
                setStories(storiesResult.value || []);
            } else {
                console.log('Stories endpoint unavailable', storiesResult.reason?.response?.status || storiesResult.reason?.message);
                setStories([]);
            }
        } catch (e) {
            console.log('Error loading home data', e);
            alert(`Erro ao carregar feed: ${e.message}`);
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
        // Optimistic update
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

    return (
        <SafeAreaView className="flex-1 bg-[#0f0d15]" edges={['top']}>
            <StatusBar style="light" />

            {/* Header */}
            <StyledView className="px-4 py-3 flex-row justify-between items-center bg-[#0f0d15]/90 border-b border-white/5">
                <StyledText className="text-white text-2xl font-bold tracking-tighter">SINOPINHAS</StyledText>
                <StyledView className="flex-row gap-4 items-center">
                    {user ? (
                        <StyledTouch onPress={() => router.push('/upload-feed')}>
                            <PlusSquare size={24} color="white" />
                        </StyledTouch>
                    ) : (
                        <Link href="/login" asChild>
                            <StyledTouch>
                                <StyledText className="text-blue-400 font-bold">Entrar</StyledText>
                            </StyledTouch>
                        </Link>
                    )}
                    <MessageCircle size={24} color="white" />
                </StyledView>
            </StyledView>

            <ScrollView
                contentContainerStyle={{ paddingBottom: 80 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
                }
            >
                {/* Stories Section */}
                <Stories
                    stories={stories}
                    user={user}
                    onStoryClick={handleStoryClick}
                    onAddStory={() => router.push('/upload-story')} // Need to implement this route
                />

                {/* Feed Section */}
                {videos.map((item) => (
                    <StyledView key={item.id} className="mb-6 border-b border-gray-900/50 pb-6">
                        <StyledView className="px-3 mb-2 flex-row items-center gap-2">
                            <StyledImage
                                source={{ uri: item.avatar || 'https://via.placeholder.com/40' }}
                                className="w-8 h-8 rounded-full border border-gray-700"
                            />
                            <StyledText className="text-white font-bold text-sm">{item.username}</StyledText>
                        </StyledView>

                        <StyledView className="bg-black mb-3 relative">
                            {item.type === 'video' ? (
                                <StyledView className="w-full aspect-[4/5] justify-center items-center bg-gray-900">
                                    {/* Video Placeholder - In real app use expo-av Video with visibility check */}
                                    <Video
                                        source={{ uri: item.video_url || item.url }}
                                        className="w-full h-full"
                                        resizeMode={ResizeMode.COVER}
                                        useNativeControls
                                        isLooping
                                    />
                                </StyledView>
                            ) : (
                                <StyledImage
                                    source={{ uri: item.thumbnail || item.url }}
                                    className="w-full aspect-[4/5]"
                                    resizeMode="cover"
                                />
                            )}
                        </StyledView>

                        <StyledView className="px-3">
                            <StyledView className="flex-row gap-5 mb-3">
                                <Heart size={26} color="white" strokeWidth={1.5} />
                                <MessageCircle size={26} color="white" strokeWidth={1.5} />
                                <Share2 size={26} color="white" strokeWidth={1.5} />
                            </StyledView>

                            <StyledText className="text-white font-bold text-sm mb-1">
                                {item.likes} curtidas
                            </StyledText>

                            <StyledText className="text-white text-sm leading-5">
                                <StyledText className="font-bold mr-2">{item.username}</StyledText> {item.title || item.description}
                            </StyledText>

                            <StyledText className="text-gray-500 text-xs mt-1 uppercase opacity-70">
                                {new Date(item.created_at).toLocaleDateString()}
                            </StyledText>
                        </StyledView>
                    </StyledView>
                ))}

                {videos.length === 0 && !loading && (
                    <StyledView className="p-10 items-center">
                        <StyledText className="text-gray-500 text-center">Nenhum post ainda.</StyledText>
                    </StyledView>
                )}

            </ScrollView>

            {/* Story Viewer Modal */}
            {viewingStoryGroup && (
                <StoryViewer
                    visible={!!viewingStoryGroup}
                    storyGroup={viewingStoryGroup}
                    onClose={() => setViewingStoryGroup(null)}
                    onStoryViewed={handleStoryViewed}
                    currentUserId={user?.id}
                    onDelete={() => {/* Implement delete */ }}
                />
            )}
        </SafeAreaView>
    );
}
