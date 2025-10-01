import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Checkbox, Header } from '../../components';
import { useNavigation } from '@react-navigation/native';
import colors from '../../styles/colorPallete';

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

    const uploads = activity.checkLists?.filter(it => (it.type || '').toLowerCase() === 'fileupload') || [];

    const onActivityChange = (updatedActivities = []) => {
        // updatedActivities is expected to be an array of objects that include an id matching the checklist item id
        console.log('Received uploaded items:', updatedActivities);
        setActivity((prev) => {
            const next = { ...prev };
            if (!Array.isArray(prev.checkLists)) return next;
            next.checkLists = prev.checkLists.map((it) => {
                if ((it.type || '').toLowerCase() !== 'fileupload') return it;
                const match = updatedActivities.find((u) => (u.id !== undefined && it.id !== undefined && String(u.id) === String(it.id)));
                if (match) {
                    // merge uploaded data onto the checklist item (e.g., set value or store file metadata)
                    return { ...it, ...match };
                }
                return it;
            });
            return next;
        });
    };


    const onMeasurementChange = (updatedMeasurement) => {
        console.log('Received updated measurement:', updatedMeasurement);
        setActivity((prev) => {
            const next = { ...prev };
            next.measurement = updatedMeasurement;
            return next;
        });
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
                {uploads.length > 0 && (
                    <Pressable style={styles.pill} onPress={() => {navigation.navigate('ActivityDocs', { uploads, onActivityChange })}}>
                        <View style={styles.pillContent}>
                            <Ionicons name="document-text-outline" size={16} color={colors.fullBlack} />
                            <Text style={styles.pillText}>Docs</Text>
                        </View>
                    </Pressable>
                )}
                    <Pressable style={styles.pill} onPress={() => {navigation.navigate('Measurements', { measurement: activity.measurement, onMeasurementChange})}}>
                        <View style={styles.pillContent}>
                            <Ionicons name="bar-chart" size={16} color={colors.fullBlack} />
                            <Text style={styles.pillText}>Measurements</Text>
                        </View>
                    </Pressable>
                    {activity.poValue?.length > 0 && (
                    <Pressable style={styles.pill} onPress={() => {navigation.navigate('AddPo', { po: activity.poValue })}}>
                        <View style={styles.pillContent}>
                            <Ionicons name="receipt-outline" size={16} color={colors.fullBlack} />
                            <Text style={styles.pillText}>PO</Text>
                        </View>
                    </Pressable>
                    )}
                </View>
            </View>

            <View style={styles.footer}>
                <Pressable style={styles.saveButton} onPress={() => { console.log('Saving activity', activity); Alert.alert('Saved', 'Activity saved (logged)'); }}>
                    <Text style={styles.saveButtonText}>Save</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: colors.fullwhite },
    title: { fontSize: 22, fontWeight: '700' },
    activityView: { paddingLeft: 0 },
    subtitle: { fontSize: 16, fontWeight: '600', color: colors, marginTop: 6 },
    checkItem: { paddingVertical: 12, paddingHorizontal: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    checkName: { fontSize: 16 },
    checkType: { color: colors.lightGrey },
    sep: { height: 1, backgroundColor: colors.offWhite },
    pillRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 12 },
    pill: { backgroundColor: colors.lighterGrey, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flex: 1, marginHorizontal: 6 },
    pillContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    pillText: { marginLeft: 8, fontSize: 14 },
    footer: { padding: 16, borderTopWidth: 1, borderTopColor: colors.lighterGrey, backgroundColor: colors.fullwhite },
    saveButton: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
    saveButtonText: { color: colors.fullwhite, fontWeight: '700', fontSize: 16 },
});
