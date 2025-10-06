import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import colors from '../../styles/colorPallete';

/**
 * ActionModal
 * Props:
 *  visible (bool)
 *  title (string)
 *  message? (string)
 *  isCancel? (bool) -> show Cancel button (always left)
 *  isDelete? (bool) -> show Delete button (red) triggers onAction('delete')
 *  isConfirm? (bool) -> show Confirm button (primary) triggers onAction('confirm')
 *  onClose? (fn) -> called when backdrop or cancel pressed
 *  onAction (fn) -> required for delete/confirm actions; receives type
 *  deleteLabel? (string)
 *  confirmLabel? (string)
 *  cancelLabel? (string)
 */
export default function ActionModal({
  visible,
  title,
  message,
  isCancel = true,
  isDelete = false,
  isConfirm = false,
  onClose,
  onAction,
  deleteLabel = 'Delete',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel'
}) {
  const showFooter = isCancel || isDelete || isConfirm;

  return (
    <Modal
      visible={!!visible}
      transparent
      animationType="fade"
      onRequestClose={() => onClose && onClose()}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {message ? <Text style={styles.message}>{message}</Text> : null}
          {showFooter && (
            <View style={styles.actionsRow}>
              {isCancel && (
                <TouchableOpacity
                  style={[styles.btn, styles.cancelBtn]}
                  onPress={() => { onClose && onClose(); }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.btnText, styles.cancelText]}>{cancelLabel}</Text>
                </TouchableOpacity>
              )}
              {isDelete && (
                <TouchableOpacity
                  style={[styles.btn, styles.deleteBtn]}
                  onPress={() => { onAction && onAction('delete'); }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.btnText}>{deleteLabel}</Text>
                </TouchableOpacity>
              )}
              {isConfirm && !isDelete && (
                <TouchableOpacity
                  style={[styles.btn, styles.confirmBtn]}
                  onPress={() => { onAction && onAction('confirm'); }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.btnText}>{confirmLabel}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.fullBlack,
    textAlign: 'center',
    marginBottom: 10
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.lightGrey,
    textAlign: 'center',
    marginBottom: 20
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8
  },
  btn: {
    minWidth: 92,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginLeft: 10
  },
  cancelBtn: {
    backgroundColor: '#f5f5f5'
  },
  deleteBtn: {
    backgroundColor: colors.red
  },
  confirmBtn: {
    backgroundColor: colors.primary
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14
  },
  cancelText: {
    color: colors.fullBlack
  }
});
