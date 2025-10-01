import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import colors from "../../styles/colorPallete";


const FileUpload = ({onPick, value, selected, label}) => {
  return (
    <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{label}</Text>
            {selected && <Text style={styles.selected}>Selected: {selected.name || selected.uri}</Text>}
          </View>
          {!value && (
          <Pressable style={styles.button} onPress={onPick}>
            <Text style={styles.buttonText}>Choose file</Text>
          </Pressable>
          )}
          {value && (
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>View file</Text>
          </Pressable>
          )}
        </View>
  )
}

export default FileUpload;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  label: { fontSize: 16, fontWeight: '400' },
  hint: { color: colors.lightGrey, marginTop: 4 },  
  selected: { marginTop: 6, color: colors.lightGrey },
  button: { backgroundColor: colors.primary, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  buttonText: { color: colors.fullwhite, fontWeight: '600' },
})


