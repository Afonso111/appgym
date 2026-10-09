
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

const GOLD = '#DBB957';

export default function OnboardingScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [experience, setExperience] = useState('Iniciante');
  const [location, setLocation] = useState('Ginásio');
  const [goal, setGoal] = useState('Ganhar músculo');
  const [days, setDays] = useState('3');
  const [loading, setLoading] = useState(false);

  const saveProfile = async () => {
    if (!name.trim() || !age || !height || !weight) {
      Alert.alert(
        'Dados em falta',
        'Preenche o nome, a idade, a altura e o peso.'
      );
      return;
    }

    const ageNum = Number(age);
    const heightNum = Number(height.replace(',', '.'));
    const weightNum = Number(weight.replace(',', '.'));
    const daysNum = Number(days);

    if (
      !Number.isInteger(ageNum) ||
      ageNum < 13 ||
      ageNum > 100 ||
      !Number.isFinite(heightNum) ||
      heightNum < 80 ||
      heightNum > 250 ||
      !Number.isFinite(weightNum) ||
      weightNum < 25 ||
      weightNum > 350 ||
      !Number.isInteger(daysNum) ||
      daysNum < 1 ||
      daysNum > 7
    ) {
      Alert.alert(
        'Dados inválidos',
        'Confirma a idade, altura, peso e dias de treino.'
      );
      return;
    }

    setLoading(true);

    try {
      const { data: { user }, error: userError } =
        await supabase.auth.getUser();

      if (userError || !user) {
        Alert.alert(
          'Sessão não encontrada',
          'Entra novamente na tua conta.'
        );
        router.replace('/login');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name: name.trim(),
          age: ageNum,
          sex: sex || null,
          height_cm: heightNum,
          weight_kg: weightNum,
          experience,
          training_location: location,
          goal,
          training_days: daysNum,
        });

      if (error) {
        Alert.alert('Erro ao guardar perfil', error.message);
        return;
      }

      Alert.alert(
        'Perfil guardado!',
        'Está tudo pronto para começares a tua evolução.',
        [
          {
            text: 'Continuar',
            onPress: () => router.replace('/'),
          },
        ]
      );
    } catch {
      Alert.alert(
        'Erro',
        'Não foi possível guardar os dados. Tenta novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  const field = (
    label: string,
    value: string,
    setter: (value: string) => void,
    placeholder: string,
    numeric = false
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={setter}
        placeholder={placeholder}
        placeholderTextColor="#777"
        keyboardType={numeric ? 'numeric' : 'default'}
        autoCapitalize="words"
      />
    </View>
  );

  const choices = (
    label: string,
    options: string[],
    selected: string,
    setter: (value: string) => void
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.options}>
        {options.map(option => (
          <Pressable
            key={option}
            onPress={() => setter(option)}
            style={[
              styles.option,
              selected === option && styles.optionSelected,
            ]}
          >
            <Text
              style={[
                styles.optionText,
                selected === option && styles.optionTextSelected,
              ]}
            >
              {option}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.logo}>APPGYM</Text>
      <Text style={styles.title}>Vamos conhecer-te.</Text>
      <Text style={styles.subtitle}>
        Personaliza a tua experiência e define os teus objetivos.
      </Text>

      {field('Nome', name, setName, 'O teu nome')}
      {field('Idade', age, setAge, 'Ex.: 22', true)}
      {field('Altura (cm)', height, setHeight, 'Ex.: 175', true)}
      {field('Peso (kg)', weight, setWeight, 'Ex.: 75', true)}

      {choices(
        'Sexo (opcional)',
        ['Masculino', 'Feminino', 'Prefiro não dizer'],
        sex,
        setSex
      )}

      {choices(
        'Experiência de treino',
        ['Iniciante', 'Intermédio', 'Avançado'],
        experience,
        setExperience
      )}

      {choices(
        'Onde treinas?',
        ['Ginásio', 'Casa', 'Ambos'],
        location,
        setLocation
      )}

      {choices(
        'Qual é o teu objetivo?',
        [
          'Ganhar músculo',
          'Perder gordura',
          'Ganhar força',
          'Melhorar condição física',
        ],
        goal,
        setGoal
      )}

      {choices(
        'Dias de treino por semana',
        ['1', '2', '3', '4', '5', '6', '7'],
        days,
        setDays
      )}

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={saveProfile}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'A GUARDAR...' : 'GUARDAR E CONTINUAR'}
        </Text>
      </Pressable>

      <Text style={styles.note}>
        Poderás atualizar os teus dados mais tarde.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020202',
  },
  content: {
    padding: 24,
    paddingTop: 55,
    paddingBottom: 50,
  },
  logo: {
    color: GOLD,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: 28,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 10,
  },
  subtitle: {
    color: '#999999',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 28,
  },
  field: {
    marginBottom: 22,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#151515',
    color: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 13,
  },
  optionSelected: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  optionText: {
    color: '#CCCCCC',
    fontSize: 13,
  },
  optionTextSelected: {
    color: '#000000',
    fontWeight: '800',
  },
  button: {
    backgroundColor: GOLD,
    padding: 18,
    borderRadius: 12,
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    textAlign: 'center',
    color: '#000000',
    fontSize: 15,
    fontWeight: '900',
  },
  note: {
    color: '#777777',
    textAlign: 'center',
    marginTop: 18,
    fontSize: 12,
  },
});