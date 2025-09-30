import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const Header = ({ title, enableBackButton }) => {
    const navigation = useNavigation();

    return (
        <View style={styles.header}>
            {enableBackButton && (
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={22} color="#000000" />
                </TouchableOpacity>
            )}
            <Text style={styles.title}>{title}</Text>
            <View style={styles.rightPlaceholder} />
        </View>
    );
};

const styles = StyleSheet.create({
    title: {
        fontSize: 24,
        fontWeight: '600',
        textAlign: 'center',
        flex: 1,
        alignSelf: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rightPlaceholder: {
        width: 40,
    },
});

export default Header;
