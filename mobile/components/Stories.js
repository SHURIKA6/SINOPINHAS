import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { styled } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouch = styled(TouchableOpacity);
const StyledImage = styled(Image);

export default function Stories({ stories, user, onStoryClick, onAddStory }) {
    if (!stories && !user) return null;

    return (
        <StyledView className="border-b border-gray-800 py-3 mb-2">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 10 }}>
                {/* Add Story Button (if logged in) */}
                {user && (
                    <StyledTouch
                        className="items-center mr-4"
                        onPress={onAddStory}
                    >
                        <StyledView className="w-16 h-16 mb-1 relative">
                            <StyledImage
                                source={{ uri: user.avatar || 'https://via.placeholder.com/100' }}
                                className="w-full h-full rounded-full border-2 border-gray-700"
                            />
                            <StyledView className="absolute bottom-0 right-0 bg-blue-500 rounded-full w-6 h-6 items-center justify-center border-2 border-[#0f0d15]">
                                <Plus size={14} color="white" strokeWidth={3} />
                            </StyledView>
                        </StyledView>
                        <StyledText className="text-white text-xs text-center w-16" numberOfLines={1}>Seu story</StyledText>
                    </StyledTouch>
                )}

                {/* Stories List */}
                {stories.map((group) => {
                    const hasUnviewed = !group.all_viewed;
                    return (
                        <StyledTouch
                            key={group.user_id}
                            className="items-center mr-4"
                            onPress={() => onStoryClick(group)}
                        >
                            <StyledView className="w-18 h-18 justify-center items-center mb-1">
                                {hasUnviewed ? (
                                    <LinearGradient
                                        colors={['#f9ce34', '#ee2a7b', '#6228d7']}
                                        style={{ width: 68, height: 68, borderRadius: 34, padding: 2, justifyContent: 'center', alignItems: 'center' }}
                                    >
                                        <StyledImage
                                            source={{ uri: group.avatar || 'https://via.placeholder.com/100' }}
                                            className="w-16 h-16 rounded-full border-2 border-[#0f0d15]"
                                        />
                                    </LinearGradient>
                                ) : (
                                    <StyledView className="w-[68px] h-[68px] rounded-full border-2 border-gray-600 justify-center items-center p-[2px]">
                                        <StyledImage
                                            source={{ uri: group.avatar || 'https://via.placeholder.com/100' }}
                                            className="w-16 h-16 rounded-full border-2 border-[#0f0d15]"
                                        />
                                    </StyledView>
                                )}
                            </StyledView>
                            <StyledText className="text-white text-xs text-center w-16" numberOfLines={1}>
                                {group.username}
                            </StyledText>
                        </StyledTouch>
                    );
                })}
            </ScrollView>
        </StyledView>
    );
}
