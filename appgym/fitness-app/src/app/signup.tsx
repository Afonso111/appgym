import { useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { supabase } from '@/lib/supabase';

export default function SignupScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  
  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Preenche o email e a password.');
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert('Erro', 'Por favor, insere um email válido.');
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        'Erro',
        'A password deve ter pelo menos 6 caracteres.'
      );
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    console.log('Utilizador:', data.user?.id);
    console.log('Sessão criada:', !!data.session);
    console.log('Erro:', error?.message);

    
    setLoading(false);

    if (error) {
      Alert.alert('Erro ao criar conta', error.message);
      return;
    }

    console.log('Utilizador criado:', data.user);

    Alert.alert(
      'Conta criada!',
      'A tua conta foi criada com sucesso.',
      [
        {
          text: 'Continuar',
          onPress: () => router.replace('/onboarding'),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>APPGYM</Text>

      <View style={styles.form}>
        <Text style={styles.title}>Criar conta</Text>

        <Text style={styles.subtitle}>
          Começa a tua evolução.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#777"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#777"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Pressable
          style={styles.button}
          onPress={handleSignup}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'A criar conta...' : 'CRIAR CONTA'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/login')}
        >
          <Text style={styles.loginText}>
            Já tens conta? Entrar
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020202',
    padding: 24,
    justifyContent: 'center',
  },

  logo: {
    color: '#DBB957',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 50,
  },

  form: {
    width: '100%',
  },

  title: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 8,
  },

  subtitle: {
    color: '#999999',
    fontSize: 16,
    marginBottom: 30,
  },

  input: {
    backgroundColor: '#151515',
    color: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 14,
    fontSize: 16,
  },

  button: {
    backgroundColor: '#DBB957',
    paddingVertical: 17,
    borderRadius: 12,
    marginTop: 10,
  },

  buttonText: {
    color: '#000000',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
  },

  loginText: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 24,
    fontSize: 15,
  },
});