import { StyleSheet, Text, View } from 'react-native';

export default function SignupScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Criar conta</Text>
      <Text style={styles.text}>Página de registo</Text>
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