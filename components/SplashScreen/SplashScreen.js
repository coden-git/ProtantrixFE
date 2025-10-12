import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, StatusBar, Image } from 'react-native';
import colors from '../../styles/colorPallete';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ onFinish }) {
  useEffect(() => {
    // Auto-hide splash screen after 3 seconds
    const timer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <Image
        source={require('../../assets/protantrix_splash.gif')}
        style={styles.splashImage}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.fullwhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashImage: {
    width: width * 0.8,
    height: height * 0.6,
    maxWidth: 400,
    maxHeight: 400,
  },
});