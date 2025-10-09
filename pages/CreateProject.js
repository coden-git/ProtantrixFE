import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../api/client';
import { Dropdown } from 'react-native-element-dropdown';
import colors from '../styles/colorPallete';
import { BACKEND_URL } from '../config';
import { AuthContext } from '../context/AuthContext';

const STATUS_OPTIONS = [
  { label: 'Ready', value: 'READY' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Deleted', value: 'DELETED' },
];

export default function CreateProject() {
  const navigation = useNavigation();
  const route = useRoute();
  const projectData = route.params?.project;
  const isEditing = !!projectData;
  const auth = React.useContext(AuthContext);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'READY',
  });
  const [saving, setSaving] = useState(false);

  // Auto-fill form when project data is provided
  useEffect(() => {
    if (projectData) {
      setFormData({
        name: projectData.name || '',
        description: projectData.description || '',
        status: projectData.status || 'READY',
      });
    }
  }, [projectData]);

  const isFormValid = formData.name.trim() && formData.description.trim() && formData.status;

  const handleSave = async () => {
    if (!isFormValid) return;

    setSaving(true);
    try {
      let response;
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        status: formData.status,
      };

      if (isEditing) {
        // Update existing project
        response = await api.put(`/projects/${projectData.uuid}`, payload);
      } else {
        // Create new project
        response = await api.post(`/projects/create`, payload);
      }

      if (response.data && response.data.ok) {
        const successMessage = isEditing ? 'Project updated successfully' : 'Project created successfully';
        Alert.alert('Success', successMessage, [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        const errorMessage = isEditing ? 'Failed to update project' : 'Failed to create project';
        Alert.alert('Error', errorMessage);
      }
    } catch (err) {
      const defaultMessage = isEditing ? 'Failed to update project' : 'Failed to create project';
      const message = err?.response?.data?.message || err.message || defaultMessage;
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBack} onPress={() => navigation.goBack()}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Project' : 'Add Project'}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.container}>
        <View style={styles.field}>
          <Text style={styles.label}>Project Name</Text>
          <TextInput
            style={[styles.input, isEditing && styles.inputDisabled]}
            placeholder="Enter project name"
            placeholderTextColor="#999"
            value={formData.name}
            onChangeText={isEditing ? undefined : (text) => setFormData(prev => ({ ...prev, name: text }))}
            editable={!isEditing}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter project description (max 30 character)"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            // maxLength={30}
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Project Status</Text>
          <Dropdown
            style={styles.dropdown}
            placeholderStyle={styles.dropdownPlaceholder}
            selectedTextStyle={styles.dropdownSelected}
            iconStyle={styles.dropdownIcon}
            data={STATUS_OPTIONS}
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder="Select status"
            value={formData.status}
            onChange={(item) => setFormData(prev => ({ ...prev, status: item.value }))}
          />
        </View>

        <TouchableOpacity
          style={styles.docsSection}
          onPress={() => {
            if (!isEditing) {
              Alert.alert('Create project first', 'Please save the project before accessing Docs.');
              return;
            }
            navigation.navigate('DocPage', { project: projectData });
          }}
        >
          <Text style={styles.docsIcon}>📄</Text>
          <Text style={styles.docsText}>Docs</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, !isFormValid && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!isFormValid || saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>{isEditing ? 'Update' : 'Save'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.fullwhite,
    paddingTop: 30,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  headerBack: {
    width: 32,
    alignItems: 'flex-start',
  },
  closeIcon: {
    fontSize: 18,
    color: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 32,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f8f8f8',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f8f8',
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  dropdownSelected: {
    fontSize: 16,
    color: '#333',
  },
  dropdownIcon: {
    width: 20,
    height: 20,
  },
  docsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  docsIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  docsText: {
    fontSize: 16,
    color: '#333',
  },
  footer: {
    padding: 16,
  },
  saveButton: {
    backgroundColor: '#4a9b8e',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  inputDisabled: {
    backgroundColor: '#f0f0f0',
    color: '#666',
  },
});