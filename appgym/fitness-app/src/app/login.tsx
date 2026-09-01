import { StyleSheet, Text, View } from 'react-native';

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <Text style={styles.text}>Página de Login</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020202',
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    color: '#FBFBFF',
    fontSize: 32,
    fontWeight: 'bold',
  },

  text: {
    color: '#DBB957',
    fontSize: 16,
    marginTop: 10,
  },
});