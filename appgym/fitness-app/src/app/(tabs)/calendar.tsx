
import { StyleSheet, Text, View } from 'react-native';

const GOLD = '#DBB957';

export default function PageScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.brand}>APPGYM</Text>
      <Text style={styles.title}>TÍTULO DA PÁGINA</Text>
      <Text style={styles.subtitle}>
        Vamos construir esta área do teu AppGym.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090909',
    justifyContent: 'center',
    padding: 25,
  },
  brand: {
    color: GOLD,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: 20,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    marginBottom: 12,
  },
  subtitle: {
    color: '#999999',
    fontSize: 15,
    lineHeight: 23,
  },
});