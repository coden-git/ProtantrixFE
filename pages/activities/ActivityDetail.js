import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Checkbox, DateRange, Header } from '../../components';
import { useNavigation } from '@react-navigation/native';
import colors from '../../styles/colorPallete';
import { MultiSelect  } from "react-native-element-dropdown";


export default function ActivityDetail({ route }) {
    const { activity: initialActivity } = route.params || {};
    const navigation = useNavigation();
    // local editable copy
    const [activity, setActivity] = useState(() => ({
        ...(initialActivity || {}),
    }));


    console.log(activity)
    const updateActivity = (index, newVal) => {
        setActivity((prev) => {
            const next = { ...prev };
            next.checkLists = prev.checkLists.map((it, i) => (i === index ? { ...it, value: newVal } : it));
            return next;
        });
    };

    const renderChecklist = ({ item, index }) => {
        if ((item.type || '').toLowerCase() === 'dropdown') {
            return (
                <View>
                    <Text style={styles.label}>{item.name}</Text>
                    <MultiSelect 
                        style={styles.dropdown}
                        data={item?.options}
                        labelField="label"
                        valueField="value"
                        placeholder={`Select ${item.name}`}
                        value={item.value}
                        onChange={(select) => updateActivity(index, select)}
                        // style for selected items (chips/pills)
                        selectedStyle={styles.selectedItem}
                        selectedTextStyle={styles.selectedText}
                        chipStyle={styles.selectedItem}
                        chipTextStyle={styles.selectedText}
                        // custom render for dropdown rows to include meta
                        renderItem={(opt) => (
                            <View style={styles.itemContainer}>
                                <Text style={styles.itemLabel}>{opt.label}</Text>
                                {opt.meta ? <Text style={styles.itemMeta}>{opt.meta}</Text> : null}
                            </View>
                        )}
                    />
                </View>
            );
        }
        if ((item.type || '').toLowerCase() === 'checkbox') {
            return (
                <View style={styles.checkItem}>
                    <Checkbox
                        label={item.name}
                        value={Boolean(item.value)}
                        onClick={(v) => updateActivity(index, v)}
                    />
                </View>
            );
        }

        if ((item.type || '').toLowerCase() === 'table') {
            return (
                <Pressable style={styles.tableRow} onPress={() => navigation.navigate('ActionTable', { item, updateActivity: (updated) => updateActivity(index, updated) })}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.label}>{item.name}</Text>
                        {item.meta ? <Text style={styles.itemMeta}>{item.meta}</Text> : null}
                    </View>
                </Pressable>
            );
        }

        if ((item?.type || '').toLowerCase() === 'daterange') {
            // value expected shape: { from: '', to: '' }
            return (
                <View>
                    <Text style={styles.label}>{item.name}</Text>
                    <DateRange
                        value={item.value || { from: '', to: '' }}
                        onChange={(val) => updateActivity(index, val)}
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

    const onPoChange = (updatedPo) => {
        console.log('Received updated PO:', JSON.stringify(updatedPo));
        setActivity((prev) => {
            const next = { ...prev };
            next.poValue = updatedPo;
            return next;
        });
    };

    const onMeasurment=() => { 
        console.log(activity.measurement)
        if (activity.measurement === 'SAME_AS_PO'){
            // updatePoToMeasurement(activity.poValue?.[0]?.value)
            if(JSON.stringify(activity.poValue?.[0]?.value) === JSON.stringify(initialActivity.poValue?.[0]?.value)){
            Alert.alert('Admin has not added po yet', '', [
                                { text: 'OK' }
                            ])
             return               
            }
            navigation.navigate('Measurements', { measurement: updatePoToMeasurement(activity.poValue?.[0]?.value), onMeasurementChange }) 
            return
        }
        navigation.navigate('Measurements', { measurement: activity.measurement, onMeasurementChange }) 
    }

    const updatePoToMeasurement = (po)=>{
        // Recursively walk the structure and remove `value` where `disabled` is false or not present
        console.log(JSON.stringify(po) === initialActivity.poValue?.[0]?.value, 'initial')
        
        const stripValues = (node) => {
            if (Array.isArray(node)) {
                return node.map((n) => stripValues(n));
            }
            if (node && typeof node === 'object') {
                const next = { ...node };

                // If this is a label cell, always keep its value (but still recurse)
                if (next.type === 'label') {
                    if (next.value !== undefined) next.value = stripValues(next.value);
                } else if ('disabled' in next) {
                    if (next.disabled === true) {
                        // keep value but still recurse into it
                        if (next.value !== undefined) next.value = stripValues(next.value);
                    } else {
                        // disabled is false -> remove value
                        if ('value' in next) delete next.value;
                    }
                } else {
                    // no disabled flag -> remove value per requirement
                    if ('value' in next) delete next.value;
                }

                // Recurse other keys (for nested structures like data, options, etc.)
                Object.keys(next).forEach((k) => {
                    if (k === 'value') return; // already handled
                    const v = next[k];
                    if (Array.isArray(v) || (v && typeof v === 'object')) {
                        next[k] = stripValues(v);
                    }
                });

                return next;
            }
            return node;
        };

        try {
            const cleaned = stripValues(po);
            console.log('updatePoToMeasurement cleaned:', JSON.stringify(cleaned));
            
            return {...cleaned, isMulti: false};
        } catch (err) {
            console.warn('updatePoToMeasurement error', err);
            return po;
        }
    }

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
                        <Pressable style={styles.pill} onPress={() => { navigation.navigate('ActivityDocs', { uploads, onActivityChange }) }}>
                            <View style={styles.pillContent}>
                                <Ionicons name="document-text-outline" size={16} color={colors.fullBlack} />
                                <Text style={styles.pillText}>Docs</Text>
                            </View>
                        </Pressable>
                    )}
                    <Pressable style={styles.pill} onPress={onMeasurment}>
                        <View style={styles.pillContent}>
                            <Ionicons name="bar-chart" size={16} color={colors.fullBlack} />
                            <Text style={styles.pillText}>Measurements</Text>
                        </View>
                    </Pressable>
                    {activity.poValue?.length > 0 && (
                        <Pressable style={styles.pill} onPress={() => { navigation.navigate('AddPo', { poValue: activity.poValue, onPoChange }) }}>
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
    dropdown: {
        height: 50,
        borderColor: "gray",
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
    },
    label: { marginLeft: 10, fontSize: 16, paddingBottom: 7 },
    selectedItem: {
        backgroundColor: colors.fullwhite,
        borderRadius: 16,
        paddingHorizontal: 10,
        paddingVertical: 6,
        margin: 4,
    },
    selectedText: {
        color: colors.fullBlack,
        fontSize: 14,
    },
    itemContainer: { paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: colors.offWhite },
    itemLabel: { fontSize: 16, color: colors.fullBlack },
    itemMeta: { fontSize: 12, color: colors.lightGrey, marginTop: 4 },
    selectedItemContent: { flexDirection: 'column' },
    selectedMetaText: { color: colors.fullwhite, fontSize: 12, marginTop: 2 },
    tableRow: { paddingVertical: 12, paddingHorizontal: 10, borderRadius: 8, backgroundColor: colors.fullwhite },

});


