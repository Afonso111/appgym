import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Vamos conhecer-te.
      </Text>

      <Text style={styles.subtitle}>
        Primeiro vamos configurar o teu perfil.
      </Text>

      <Pressable
        style={styles.button}
        onPress={() => router.replace('/')}
      >
        <Text style={styles.buttonText}>
          COMEÇAR
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020202',
    justifyContent: 'center',
    padding: 24,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 12,
  },

  subtitle: {
    color: '#999999',
    fontSize: 17,
    marginBottom: 40,
  },

  button: {
    backgroundColor: '#DBB957',
    paddingVertical: 17,
    borderRadius: 12,
  },

  buttonText: {
    color: '#000000',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
  },
});