import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import Login from './pages/login/LoginScreen';
import { NavigationContainer } from '@react-navigation/native';
import Tabs from './navigation/Tabs';
import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActionTable, ActivitiesScreen, ActivityDocs, AddPo, Measurements } from './pages';
import DocPage from './pages/DocPage';
import ActivityDetail from './pages/activities/ActivityDetail';
import colors from './styles/colorPallete';
import CreateProject from './pages/CreateProject';
import AddUser from './pages/AddUser';
import UsersList from './pages/UsersList';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { SplashScreen } from './components';
const Stack = createNativeStackNavigator();

function RootNavigator() {
  const auth = React.useContext(AuthContext);
  const [showSplash, setShowSplash] = useState(true);

  // Show splash screen
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // While loading stored credentials
  if (auth.loading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}> 
        <StatusBar style="auto" />
        <Text style={{ color: colors.fullBlack }}>Loading...</Text>
      </View>
    );
  }

  const isSignedIn = !!auth.token;

  if (!isSignedIn) {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <Login />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={Tabs} />
        <Stack.Screen name="Activities" component={ActivitiesScreen} />
        <Stack.Screen name="ActivityDetail" component={ActivityDetail} />
        <Stack.Screen name="AddPo" component={AddPo} />
        <Stack.Screen name="Measurements" component={Measurements} />
        <Stack.Screen name="ActivityDocs" component={ActivityDocs} />
        <Stack.Screen name="ActionTable" component={ActionTable} />
        <Stack.Screen name="CreateProject" component={CreateProject} />
        <Stack.Screen name="AddUser" component={AddUser} />
        <Stack.Screen name="UsersList" component={UsersList} />
        <Stack.Screen name="DocPage" component={DocPage} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    backgroundColor: colors.fullwhite,
    marginTop: 30,
  },
});
