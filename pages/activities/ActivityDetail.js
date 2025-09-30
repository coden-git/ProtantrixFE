import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Checkbox, Header } from '../../components';
import { useNavigation } from '@react-navigation/native';

export default function ActivityDetail({ route }) {
    const { activity: initialActivity } = route.params || {};
    const navigation = useNavigation();
    // local editable copy
    const [activity, setActivity] = useState(() => ({
        ...(initialActivity || {}),
    }));


    console.log(activity)
    const toggleChecklistAt = (index, newVal) => {
        setActivity((prev) => {
            const next = { ...prev };
            next.checkLists = prev.checkLists.map((it, i) => (i === index ? { ...it, value: newVal } : it));
            return next;
        });
    };

    const renderChecklist = ({ item, index }) => {
        if ((item.type || '').toLowerCase() === 'checkbox') {
            return (
                <View style={styles.checkItem}>
                    <Checkbox
                        label={item.name}
                        value={Boolean(item.value)}
                        onClick={(v) => toggleChecklistAt(index, v)}
                    />
                </View>
            );
        }
    };

    return (
        <View style={styles.container}>
            <Header title={activity?.name ?? 'Activity'} enableBackButton={true} />
            <View style={styles.activityView}>

                <Text style={styles.subtitle}>Checklists</Text>

                <FlatList
                    data={activity.checkLists}
                    keyExtractor={(it, idx) => String(it.name || idx)}
                    renderItem={renderChecklist}
                    ItemSeparatorComponent={() => <View style={styles.sep} />}
                    contentContainerStyle={{ paddingTop: 8 }}
                />
                <View style={styles.pillRow}>
                    <Pressable style={styles.pill} onPress={() => {navigation.navigate('ActivityDocs', { uploads: activity.checkLists?.filter(it => it.type === 'FileUpload') })}}>
                        <View style={styles.pillContent}>
                            <Ionicons name="document-text-outline" size={16} color="#333" />
                            <Text style={styles.pillText}>Docs</Text>
                        </View>
                    </Pressable>
                    <Pressable style={styles.pill} onPress={() => {navigation.navigate('Measurements', { measurements: activity.measurements })}}>
                        <View style={styles.pillContent}>
                            <Ionicons name="bar-chart" size={16} color="#333" />
                            <Text style={styles.pillText}>Measurements</Text>
                        </View>
                    </Pressable>
                    {activity.poValue?.length > 0 && (
                    <Pressable style={styles.pill} onPress={() => {navigation.navigate('AddPo', { po: activity.poValue })}}>
                        <View style={styles.pillContent}>
                            <Ionicons name="receipt-outline" size={16} color="#333" />
                            <Text style={styles.pillText}>PO</Text>
                        </View>
                    </Pressable>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    title: { fontSize: 22, fontWeight: '700' },
    activityView: { paddingLeft: 0 },
    subtitle: { fontSize: 16, fontWeight: '600', color: '#000000', marginTop: 6 },
    checkItem: { paddingVertical: 12, paddingHorizontal: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    checkName: { fontSize: 16 },
    checkType: { color: '#666' },
    sep: { height: 1, backgroundColor: '#eee' },
    pillRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 12 },
    pill: { backgroundColor: '#c9c8c8ff', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flex: 1, marginHorizontal: 6 },
    pillContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    pillText: { marginLeft: 8, fontSize: 14 },
});
