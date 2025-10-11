import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import colors from '../styles/colorPallete';
import api from '../api/client';
import { Dropdown } from 'react-native-element-dropdown';
import Header from '../components/Header/header';
import ActionModal from '../components/ActionModal/ActionModal';
import { MultiSelect } from 'react-native-element-dropdown';

const ROLE_OPTIONS = [
    { label: 'User', value: 'user' },
    { label: 'Admin', value: 'admin' },
];

export default function AddUser() {
    const navigation = useNavigation();
    const route = useRoute();
    const editingUser = route?.params?.user || null; // { name, phone, role, id, isActive }
    const isEdit = !!editingUser;

    const [name, setName] = useState(editingUser?.name || '');
    const [phone, setPhone] = useState(editingUser?.phone || '');
    const [role, setRole] = useState(editingUser?.role || 'user');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');
    const [touched, setTouched] = useState({});
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [projects, setProjects] = useState([]); // fetched list
    const [selectedProjects, setSelectedProjects] = useState(editingUser?.projects || []);
    const id = editingUser?.id 
    useEffect(() => {
        if (editingUser) {
            setName(editingUser.name || '');
            setPhone(editingUser.phone || '');
            setRole(editingUser.role || 'user');
        }
    }, [editingUser]);

    useEffect(() => {
        // fetch projects list (limit 1000)
        let mounted = true;
        const loadProjects = async () => {
            try {
                const res = await api.get('/projects/list', { params: { limit: 1000 } });
                if (res?.data && mounted) {
                    const list = Array.isArray(res.data.items) ? res.data.items : (res.data.data || []);
                    // normalize each project to { uuid, name }
                    const normalized = list.map(p => ({ uuid: p.uuid, name: p.name }));
                    setProjects(normalized.filter(p => p.uuid && p.name));
                    if(editingUser?.projects?.length) {
                        selectedProjects(editingUser.projects)
                    }
                }
            } catch (err) {
                console.warn('Failed to load projects', err?.message);
            }
        };
        loadProjects();
        return () => { mounted = false; };
    }, []);

    const markTouched = (field) => setTouched(prev => ({ ...prev, [field]: true }));
    const cleanPhone = (p) => String(p || '').replace(/\D/g, '');

    const phoneDigits = cleanPhone(phone);
    const passwordStrength = useMemo(() => {
        if (!password) return 0;
        let score = 0;
        if (password.length >= 6) score++;
        if (password.length >= 10) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        return score; // 0 - 5
    }, [password]);

    const passwordStrengthLabel = ['Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Strong'][passwordStrength];
    const passwordBarColors = ['#ccc', '#d9534f', '#f0ad4e', '#5bc0de', '#5cb85c', '#2e8b57'];

    const createValid = name.trim() && phoneDigits.length === 10 && password && confirm && password === confirm;
    const editValid = name.trim() && phoneDigits.length === 10;
    const valid = isEdit ? editValid : createValid;

    const submit = useCallback(async () => {
        setError('');
        if (!valid) return;
        if (phoneDigits.length !== 10) {
            setError('Phone must be 10 digits');
            return;
        }
        setLoading(true);
        try {
            const projectPayload = selectedProjects.map(p => (typeof p === 'string' ? { uuid: p, name: (projects.find(pr => pr.uuid === p)?.name) || '' } : p));
            if (isEdit) {
                if (!id) throw new Error('Missing user id');
                const payload = { name: name.trim(), role, projects: projectPayload };
                const res = await api.patch(`/user/${id}`, payload);
                if (!res?.data?.ok) throw new Error(res?.data?.error || 'Failed to update user');
                navigation.goBack();
                // Alert.alert('Success', 'User updated', [{ text: 'OK', onPress: () => navigation.goBack() }]);
            } else {
                const payload = { name: name.trim(), phone: phoneDigits, password, role, projects: projectPayload };
                const res = await api.post('/user/create', payload);
                if (!res?.data?.ok) throw new Error(res?.data?.error || 'Failed to create user');
                navigation.goBack();
            }
        } catch (e) {
            setError(e.message || (isEdit ? 'Error updating user' : 'Error creating user'));
        } finally {
            setLoading(false);
        }
    }, [valid, name, phoneDigits, password, role, confirm, isEdit, navigation, selectedProjects, projects]);

    const handleDelete = useCallback(() => {
        if (!isEdit) return;
        setConfirmVisible(true);
    }, [isEdit]);

    const performToggleActive = useCallback(async () => {
        if (!id) { setError('Missing user id'); return; }
        const currentlyActive = editingUser?.isActive !== false;
        setDeleting(true);
        try {
            const res = await api.patch(`/user/${id}`, { isActive: !currentlyActive });
            if (!res?.data?.ok) throw new Error(res?.data?.error || `Failed to ${currentlyActive ? 'deactivate' : 'activate'} user`);
            navigation.goBack();
        } catch (e) {
            setError(e.message || `Error ${currentlyActive ? 'deactivating' : 'activating'} user`);
        } finally {
            setDeleting(false);
            setConfirmVisible(false);
        }
    }, [id, editingUser, navigation]);

    const fieldError = (field) => {
        if (!touched[field]) return '';
        switch (field) {
            case 'name':
                return name.trim() ? '' : 'Name required';
            case 'phone':
                return phoneDigits.length === 10 ? '' : '10 digits required';
            case 'password':
                if (isEdit) return '';
                return password ? (password.length >= 6 ? '' : 'Min 6 chars') : 'Password required';
            case 'confirm':
                if (isEdit) return '';
                return confirm ? (confirm === password ? '' : 'Passwords do not match') : 'Confirm password';
            default:
                return '';
        }
    };

    // derive multi-select value as array of uuids
    const selectedProjectIds = useMemo(() => selectedProjects.map(p => (typeof p === 'string' ? p : p.uuid)), [selectedProjects]);

    const projectOptions = useMemo(() => projects.map(p => ({ label: p.name, value: p.uuid })), [projects]);

    console.log({ pr: selectedProjects });


    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                <Header title={isEdit ? 'Edit User' : 'Add User'} enableBackButton={true} />

                {isEdit && (
                    <View style={styles.banner}>
                        <Text style={styles.bannerText}>Edit mode</Text>
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Basic Info</Text>
                    <View style={styles.fieldWrapper}>
                        <TextInput
                            placeholder="Full Name"
                            value={name}
                            onChangeText={t => { setName(t); }}
                            onBlur={() => markTouched('name')}
                            style={[styles.input, fieldError('name') && styles.inputError]}
                            autoCapitalize="words"
                            returnKeyType="next"
                        />
                        {fieldError('name') ? <Text style={styles.fieldErrorText}>{fieldError('name')}</Text> : null}
                    </View>
                    <View style={styles.fieldWrapper}>
                        <TextInput
                            placeholder="Phone (10 digits)"
                            value={phone}
                            onChangeText={t => { setPhone(t); }}
                            onBlur={() => markTouched('phone')}
                            style={[styles.input, fieldError('phone') && styles.inputError, isEdit && styles.disabled]}
                            keyboardType="phone-pad"
                            maxLength={14}
                            editable={!isEdit}
                        />
                        {fieldError('phone') ? <Text style={styles.fieldErrorText}>{fieldError('phone')}</Text> : null}
                    </View>
                    <View style={styles.fieldWrapper}>
                        <Text style={styles.roleLabel}>Role</Text>
                        <Dropdown
                            style={styles.dropdown}
                            data={ROLE_OPTIONS}
                            labelField="label"
                            valueField="value"
                            value={role}
                            placeholder="Select role"
                            onChange={(item) => setRole(item.value)}
                        />
                    </View>
                </View>

                {!isEdit && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Security</Text>
                        <View style={styles.fieldWrapper}>
                            <TextInput
                                placeholder="Password"
                                value={password}
                                onChangeText={t => { setPassword(t); }}
                                onBlur={() => markTouched('password')}
                                style={[styles.input, fieldError('password') && styles.inputError]}
                                secureTextEntry
                            />
                            {fieldError('password') ? <Text style={styles.fieldErrorText}>{fieldError('password')}</Text> : null}
                            {password ? (
                                <View style={styles.strengthRow}>
                                    <View style={[styles.strengthBar, { backgroundColor: passwordBarColors[passwordStrength], width: `${(passwordStrength / 5) * 100}%` }]} />
                                    <Text style={styles.strengthLabel}>{passwordStrengthLabel}</Text>
                                </View>
                            ) : null}
                        </View>
                        <View style={styles.fieldWrapper}>
                            <TextInput
                                placeholder="Confirm Password"
                                value={confirm}
                                onChangeText={t => { setConfirm(t); }}
                                onBlur={() => markTouched('confirm')}
                                style={[styles.input, fieldError('confirm') && styles.inputError]}
                                secureTextEntry
                            />
                            {fieldError('confirm') ? <Text style={styles.fieldErrorText}>{fieldError('confirm')}</Text> : null}
                        </View>
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Projects Access</Text>
                    <View style={styles.fieldWrapper}>
                        <MultiSelect
                            style={styles.dropdown}
                            data={projectOptions}
                            labelField="label"
                            valueField="value"
                            placeholder={projectOptions.length ? 'Select projects' : 'Loading projects...'}
                            value={selectedProjectIds}
                            onChange={(items) => {
                                // items is array of values
                                const mapped = items.map(v => projects.find(p => p.uuid === v)).filter(Boolean);
                                setSelectedProjects(mapped);
                            }}
                            disable={projects.length === 0}
                            selectedStyle={styles.selectedItem}
                            selectedTextStyle={styles.selectedText}
                            chipStyle={styles.selectedItem}
                            chipTextStyle={styles.selectedText}
                        />
                        
                    </View>
                </View>

                {error ? <Text style={styles.globalError}>{error}</Text> : null}
            </ScrollView>
            <View style={styles.footer}>
                {(editingUser?.isActive === true || !editingUser) && <TouchableOpacity style={[styles.primaryBtn, !valid && styles.disabledBtn]} disabled={!valid || loading} onPress={submit} activeOpacity={0.85}>
                    {loading ? <ActivityIndicator color={colors.fullwhite} /> : <Text style={styles.primaryBtnText}>{isEdit ? 'Save Changes' : 'Create User'}</Text>}
                </TouchableOpacity>
                }
                {isEdit && (
                    <TouchableOpacity style={[styles.deleteBtn, deleting && { opacity: 0.6 }, editingUser?.isActive === false && styles.enableBtn]} disabled={deleting} onPress={handleDelete} activeOpacity={0.85}>
                        {deleting ? <ActivityIndicator color={colors.fullwhite} /> : <Text style={styles.deleteText}>{editingUser?.isActive === false ? 'Enable User' : 'Deactivate User'}</Text>}
                    </TouchableOpacity>
                )}
            </View>
            
            {isEdit && (
                <ActionModal
                    visible={confirmVisible}
                    title={editingUser?.isActive === false ? 'Enable User' : 'Deactivate User'}
                    message={editingUser?.isActive === false ? 'Re-activate this user so they can login again.' : 'Set this user inactive? They will no longer be able to login.'}
                    isCancel
                    isDelete
                    deleteLabel={editingUser?.isActive === false ? 'Enable' : 'Deactivate'}
                    cancelLabel="Cancel"
                    onClose={() => setConfirmVisible(false)}
                    onAction={(type) => performToggleActive()}
                />
            )}
        </KeyboardAvoidingView>
    );
}

const baseInput = {
    backgroundColor: '#edf3f5',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'transparent'
};

const styles = StyleSheet.create({
    scroll: { padding: 16, paddingBottom: 120, paddingTop: 30 },
    section: { marginBottom: 28 },
    sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12, color: colors.fullBlack, letterSpacing: 0.5 },
    fieldWrapper: { marginBottom: 16 },
    input: baseInput,
    inputError: { borderColor: colors.red, backgroundColor: '#ffecec' },
    disabled: { opacity: 0.6 },
    roleLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6, color: colors.fullBlack },
    dropdown: { backgroundColor: '#edf3f5', borderRadius: 10, paddingHorizontal: 12, height: 52, borderWidth: 1, borderColor: 'transparent' },
    fieldErrorText: { marginTop: 6, color: colors.red, fontSize: 12, fontWeight: '500' },
    strengthRow: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
    strengthBar: { height: 6, borderRadius: 4 },
    strengthLabel: { fontSize: 12, color: colors.lightGrey, fontWeight: '600' },
    primaryBtn: { backgroundColor: colors.primary, paddingVertical: 18, borderRadius: 12, alignItems: 'center', marginBottom: 14 },
    primaryBtnText: { color: colors.fullwhite, fontWeight: '700', fontSize: 16 },
    disabledBtn: { backgroundColor: colors.lighterGrey },
    deleteBtn: { backgroundColor: colors.red, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
    deleteText: { color: colors.fullwhite, fontWeight: '700', fontSize: 16 },
    enableBtn: { backgroundColor: '#2ecc71' },
    footer: { padding: 16, backgroundColor: '#fff' },
    globalError: { color: colors.red, textAlign: 'center', paddingHorizontal: 16, marginBottom: 12, fontWeight: '500' },
    banner: { backgroundColor: '#eef7ff', padding: 12, borderRadius: 10, marginBottom: 20, borderWidth: 1, borderColor: '#d4e9ff' },
    bannerText: { color: '#2b5773', fontSize: 12, fontWeight: '500', lineHeight: 16 },
    selectedItem: { backgroundColor: colors.fullwhite, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, margin: 4, borderWidth: 1, borderColor: colors.lighterGrey },
    selectedText: { color: colors.fullBlack, fontSize: 13 },
    helperNote: { marginTop: 6, fontSize: 11, color: colors.lightGrey },
});
