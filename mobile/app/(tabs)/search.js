import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { styled } from 'nativewind';
import { Search } from 'lucide-react-native';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledInput = styled(TextInput);
const StyledTouch = styled(TouchableOpacity);

export default function SearchScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);

    return (
        <SafeAreaView className="flex-1 bg-[#0E2A47]">
            <StatusBar style="light" />

            <StyledView className="px-4 py-4 bg-[#0E2A47]">
                <StyledView className="flex-row items-center bg-gray-800 rounded-full pl-4 pr-2 py-2">
                    <Search size={20} color="#666" />
                    <StyledInput
                        className="flex-1 text-white ml-2"
                        placeholder="Buscar vídeos, usuários..."
                        placeholderTextColor="#666"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </StyledView>
            </StyledView>

            <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
                <StyledView className="items-center justify-center py-20">
                    <StyledText className="text-gray-400">Busque por vídeos ou usuários</StyledText>
                </StyledView>
            </ScrollView>
        </SafeAreaView>
    );
}
