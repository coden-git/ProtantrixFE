
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import Login from './pages/login/LoginScreen';
import { NavigationContainer } from '@react-navigation/native';
import Tabs from './navigation/Tabs';
import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivitiesScreen, ActivityDocs, AddPo, Measurements } from './pages';
import ActivityDetail from './pages/activities/ActivityDetail';
import colors from './styles/colorPallete';
const Stack = createNativeStackNavigator();

export default function App() {
  const [signedIn, setSignedIn] = useState(true);

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      {!signedIn ? (
        <Login onLoginSuccess={() => setSignedIn(true)} />
      ) : (
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Tabs" component={Tabs} />
            <Stack.Screen name="Activities" component={ActivitiesScreen} />
            <Stack.Screen name="ActivityDetail" component={ActivityDetail} />
            <Stack.Screen name="AddPo" component={AddPo} />
            <Stack.Screen name="Measurements" component={Measurements} />
            <Stack.Screen name="ActivityDocs" component={ActivityDocs} />
          </Stack.Navigator>
        </NavigationContainer>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    backgroundColor: colors.fullwhite,
    marginTop: 30,
  },
});
