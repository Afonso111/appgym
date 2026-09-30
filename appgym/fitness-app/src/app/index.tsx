import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase'; 


export default function HomeScreen() {
  const testSupabase = async () => {
  const { data, error } = await supabase.auth.getSession();

  console.log('Supabase:', data);
  console.log('Erro:', error);
};

  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Welcome to the Fitness App!</Text>
      <Text style={styles.subtitle}>Your journey to a healthier lifestyle starts here.</Text>
      <View style={styles.content}>
        <Text style={styles.text}>Explore workouts, track your progress, and stay motivated!</Text>
      </View>
      <Pressable style={styles.loginButton}
        onPress={() => router.push('/login')}>
        <Text style={styles.loginButtonText}>Login</Text>
      </Pressable>
      <Pressable style={styles.signupButton}
        onPress={() => router.push('/signup')}>
        <Text style={styles.signupButtonText}>Sign Up</Text>
      </Pressable>
      <Pressable
  onPress={testSupabase}
  style={styles.loginButton}
>
  <Text style={styles.loginButtonText}>
    TESTAR SUPABASE
  </Text>
</Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#020202ec',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#FBFBFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#FBFBFF',
    marginBottom: 20,
  },
  content: {
    marginBottom: 20,
  },
  text: {
    fontSize: 14,
    color: '#DBB957',
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#FBFBFF',
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
  },
  loginButtonText: {
    color: '#000000',
    fontWeight: 'bold',
  },
  signupButton: {
    backgroundColor: '#DBB957',
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
  },
  signupButtonText: {
    color: '#FBFBFF',
    fontWeight: 'bold',
  },
})