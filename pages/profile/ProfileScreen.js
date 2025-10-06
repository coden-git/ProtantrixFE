import React, { useContext, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import colors from '../../styles/colorPallete';
import { AuthContext } from '../../context/AuthContext';
import Header from '../../components/Header/header';

export default function ProfileScreen({ navigation }) {
  const { user, name, role, logout } = useContext(AuthContext);
  const phone = user?.phone || '—';

  const initials = useMemo(() => {
    if (!name) return '?';
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(p => p[0].toUpperCase())
      .join('');
  }, [name]);

  const isAdmin = role === 'admin';

  return (
    <View style={styles.root}>
      <Header title="Profile" enableBackButton={true} />
      <View style={styles.scrollArea}>
        <View style={styles.avatarWrapper}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.userName}>{name || 'Unknown User'}</Text>
          <View style={[styles.roleBadge, isAdmin ? styles.roleAdmin : styles.roleUser]}>
            <Text style={styles.roleBadgeText}>{role || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.cardsRow}>
          <View style={styles.infoCard}>
            <Text style={styles.cardLabel}>Phone</Text>
            <Text style={styles.cardValue}>{phone}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.cardLabel}>Status</Text>
            <Text style={styles.cardValue}>{user?.isActive ? 'Active' : 'Inactive'}</Text>
          </View>
        </View>

        {Array.isArray(user?.projects) && user.projects.length > 0 && (
          <View style={styles.projectsSection}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {user.projects.map(p => (
              <View style={styles.projectPill} key={p.uuid}>
                <Text style={styles.projectText}>{p.name}</Text>
              </View>
            ))}
          </View>
        )}

        {isAdmin && (
          <View style={styles.adminSection}>
            <Text style={styles.sectionTitle}>Administration</Text>
            <TouchableOpacity style={styles.adminButton} onPress={() => navigation.navigate('UsersList')} activeOpacity={0.85}>
              <Text style={styles.adminButtonText}>Manage Users</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const CARD_BG = colors.offWhite || '#f4f4f4';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff', paddingTop:30 },
  scrollArea: { flex: 1, padding: 20 },
  avatarWrapper: { alignItems: 'center', marginBottom: 28 },
  avatarCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 40, fontWeight: '700' },
  userName: { fontSize: 24, fontWeight: '700', color: colors.fullBlack, marginBottom: 6 },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
  roleAdmin: { backgroundColor: colors.primary },
  roleUser: { backgroundColor: colors.lighterGrey },
  roleBadgeText: { color: '#fff', fontWeight: '600', fontSize: 12, letterSpacing: 0.5 },
  cardsRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  infoCard: { flex: 1, backgroundColor: CARD_BG, padding: 16, borderRadius: 12, elevation: 2 },
  cardLabel: { fontSize: 12, textTransform: 'uppercase', color: colors.lightGrey, marginBottom: 4, fontWeight: '600' },
  cardValue: { fontSize: 16, fontWeight: '600', color: colors.fullBlack },
  projectsSection: { marginBottom: 32 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, color: colors.fullBlack },
  projectPill: { backgroundColor: CARD_BG, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 8 },
  projectText: { fontSize: 14, fontWeight: '500', color: colors.fullBlack },
  adminSection: { marginBottom: 32 },
  adminButton: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginBottom: 8 },
  adminButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  logoutBtn: { marginTop: 'auto', backgroundColor: colors.red, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
