import React from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import colors from '../styles/colorPallete';
import FolderTree from '../components/FolderTree/FolderTree';
import api from '../api/client';

export default function DocPage() {
  const navigation = useNavigation();
  const route = useRoute();
  const project = route.params?.project;
  const [tree, setTree] = React.useState(project?.docs || []);

  const onChange = async(newTree) => {
    setTree(newTree);
    console.log('Updated tree:', JSON.stringify(newTree));
    // optimistic update
    // persist to backend if project exists
    const id = project?.uuid;
    if (!id) return;
    try {
      await api.put(`/projects/${id}`, { docs: newTree }, { timeout: 20000 });
    } catch (err) {
    console.warn('Failed to persist docs', err?.response?.data || err?.message || err);
    }

  }

  console.log('Project in DocPage:', JSON.stringify(tree));

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBack} onPress={() => navigation.goBack()}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Doc Page</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.container}>
        <Text style={styles.title}>Project Documents</Text>
        {project ? (
          <Text style={styles.subtitle}>For: {project.name}</Text>
        ) : (
          <Text style={styles.subtitle}>No project provided</Text>
        )}
        <View style={{ height: 12 }} />
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          <FolderTree
            data={tree}
            onChange={onChange}
            basePath={`projects/${project?.uuid || 'unknown'}/docs`}
            initialExpanded
          />
        </ScrollView>
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.fullBlack,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  placeholder: {
    fontSize: 14,
    color: '#888',
  },
});
