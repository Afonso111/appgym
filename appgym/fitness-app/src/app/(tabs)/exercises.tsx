
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

type Plan = {
  id: string;
  name: string;
  description: string | null;
};

type Exercise = {
  id: string;
  name: string;
  muscle_group: string;
  equipment: string | null;
};

export default function TrainScreen() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [planName, setPlanName] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [view, setView] = useState<'plans' | 'exercises'>('plans');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    const [plansResult, exercisesResult] = await Promise.all([
      supabase
        .from('workout_plans')
        .select('id, name, description')
        .eq('is_archived', false)
        .order('created_at', { ascending: false }),
      supabase
        .from('exercises')
        .select('id, name, muscle_group, equipment')
        .order('muscle_group')
        .order('name'),
    ]);

    if (plansResult.error) {
      Alert.alert('Erro nos planos', plansResult.error.message);
    } else {
      setPlans(plansResult.data ?? []);
    }

    if (exercisesResult.error) {
      Alert.alert('Erro nos exercícios', exercisesResult.error.message);
    } else {
      setExercises(exercisesResult.data ?? []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function createPlan() {
    const name = planName.trim();

    if (!name) {
      Alert.alert('Nome em falta', 'Escreve um nome para o plano.');
      return;
    }

    setSaving(true);

    const { data: userData, error: userError } =
      await supabase.auth.getUser();

    if (userError || !userData.user) {
      setSaving(false);
      Alert.alert('Sessão necessária', 'Entra na tua conta e tenta novamente.');
      return;
    }

    const { data, error } = await supabase
      .from('workout_plans')
      .insert({
        user_id: userData.user.id,
        name,
      })
      .select('id, name, description')
      .single();

    setSaving(false);

    if (error) {
      Alert.alert('Não foi possível criar o plano', error.message);
      return;
    }

    setPlans((current) => [data, ...current]);
    setSelectedPlanId(data.id);
    setPlanName('');
    setView('exercises');
  }

  async function addExercise(exercise: Exercise) {
    if (!selectedPlanId) {
      Alert.alert('Escolhe um plano', 'Seleciona primeiro um plano de treino.');
      setView('plans');
      return;
    }

    const { data: existing, error: checkError } = await supabase
      .from('plan_exercises')
      .select('id')
      .eq('plan_id', selectedPlanId)
      .eq('exercise_id', exercise.id)
      .limit(1);

    if (checkError) {
      Alert.alert('Erro', checkError.message);
      return;
    }

    if (existing && existing.length > 0) {
      Alert.alert('Já adicionado', 'Este exercício já faz parte do plano.');
      return;
    }

    const { error } = await supabase.from('plan_exercises').insert({
      plan_id: selectedPlanId,
      exercise_id: exercise.id,
      position: 0,
      target_sets: 3,
      target_reps_min: 8,
      target_reps_max: 12,
      rest_seconds: 90,
    });

    if (error) {
      Alert.alert('Erro ao adicionar exercício', error.message);
      return;
    }

    Alert.alert(
      'Exercício adicionado!',
      `${exercise.name} foi adicionado ao plano.`,
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#DBB957" />
        <Text style={styles.muted}>A preparar os teus treinos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.brand}>APPGYM</Text>
        <Text style={styles.title}>Treinar</Text>
        <Text style={styles.subtitle}>
          Cria o teu plano. Trabalha pela tua evolução.
        </Text>

        <View style={styles.statsCard}>
          <Ionicons name="barbell-outline" size={30} color="#DBB957" />
          <View style={{ flex: 1 }}>
            <Text style={styles.statsTitle}>O teu próximo objetivo</Text>
            <Text style={styles.muted}>
              Prepara um plano e começa a registar os teus treinos.
            </Text>
          </View>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, view === 'plans' && styles.activeTab]}
            onPress={() => setView('plans')}
          >
            <Text style={[styles.tabText, view === 'plans' && styles.activeTabText]}>
              Os meus planos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, view === 'exercises' && styles.activeTab]}
            onPress={() => setView('exercises')}
          >
            <Text style={[styles.tabText, view === 'exercises' && styles.activeTabText]}>
              Exercícios
            </Text>
          </TouchableOpacity>
        </View>

        {view === 'plans' ? (
          <>
            <Text style={styles.sectionTitle}>Criar um plano</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex.: Peito e tríceps"
              placeholderTextColor="#777"
              value={planName}
              onChangeText={setPlanName}
              maxLength={60}
            />
            <TouchableOpacity
              style={[styles.primaryButton, saving && styles.disabledButton]}
              onPress={createPlan}
              disabled={saving}
            >
              <Ionicons name="add-circle-outline" size={21} color="#111" />
              <Text style={styles.primaryButtonText}>
                {saving ? 'A guardar...' : 'Criar plano'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Os teus planos</Text>

            {plans.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="clipboard-outline" size={36} color="#DBB957" />
                <Text style={styles.cardTitle}>Ainda não tens planos</Text>
                <Text style={styles.muted}>
                  Cria o teu primeiro plano no campo acima.
                </Text>
              </View>
            ) : (
              plans.map((plan) => (
                <TouchableOpacity
                  key={plan.id}
                  style={[
                    styles.planCard,
                    selectedPlanId === plan.id && styles.selectedCard,
                  ]}
                  onPress={() => {
                    setSelectedPlanId(plan.id);
                    setView('exercises');
                  }}
                >
                  <View style={styles.planIcon}>
                    <Ionicons name="barbell" size={22} color="#DBB957" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{plan.name}</Text>
                    <Text style={styles.muted}>Toca para adicionar exercícios</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={21} color="#DBB957" />
                </TouchableOpacity>
              ))
            )}
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Escolher exercícios</Text>

            {selectedPlanId ? (
              <View style={styles.selectedPlanBanner}>
                <Ionicons name="checkmark-circle" size={19} color="#DBB957" />
                <Text style={styles.selectedPlanText}>
                  Plano: {plans.find((p) => p.id === selectedPlanId)?.name}
                </Text>
                <TouchableOpacity onPress={() => setSelectedPlanId(null)}>
                  <Text style={styles.changeText}>Alterar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.choosePlanButton}
                onPress={() => setView('plans')}
              >
                <Text style={styles.changeText}>Escolher primeiro um plano</Text>
              </TouchableOpacity>
            )}

            {exercises.map((exercise) => (
              <View key={exercise.id} style={styles.exerciseCard}>
                <View style={styles.exerciseIcon}>
                  <Ionicons name="fitness-outline" size={23} color="#DBB957" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{exercise.name}</Text>
                  <Text style={styles.muted}>
                    {exercise.muscle_group}
                    {exercise.equipment ? ` · ${exercise.equipment}` : ''}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => addExercise(exercise)}
                >
                  <Ionicons name="add" size={22} color="#111" />
                </TouchableOpacity>
              </View>
            ))}

            {exercises.length === 0 && (
              <Text style={styles.muted}>
                Não foram encontrados exercícios no catálogo.
              </Text>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#101010' },
  content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  center: {
    flex: 1,
    backgroundColor: '#101010',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  brand: { color: '#DBB957', fontSize: 12, fontWeight: '800', letterSpacing: 4 },
  title: { color: '#FFF', fontSize: 32, fontWeight: '800', marginTop: 8 },
  subtitle: { color: '#999', fontSize: 14, marginTop: 6, lineHeight: 21 },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#1B1B1B',
    padding: 18,
    borderRadius: 18,
    marginTop: 25,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#2B2B2B',
  },
  statsTitle: { color: '#FFF', fontSize: 15, fontWeight: '700', marginBottom: 5 },
  muted: { color: '#999', fontSize: 12, lineHeight: 18 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#1B1B1B',
    padding: 5,
    borderRadius: 12,
    marginBottom: 25,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 9 },
  activeTab: { backgroundColor: '#DBB957' },
  tabText: { color: '#AAA', fontSize: 13, fontWeight: '600' },
  activeTabText: { color: '#111' },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 13,
    marginTop: 5,
  },
  input: {
    backgroundColor: '#1B1B1B',
    borderWidth: 1,
    borderColor: '#333',
    color: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#DBB957',
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 28,
  },
  primaryButtonText: { color: '#111', fontWeight: '800', fontSize: 15 },
  disabledButton: { opacity: 0.6 },
  emptyCard: {
    backgroundColor: '#1B1B1B',
    padding: 25,
    alignItems: 'center',
    borderRadius: 16,
    gap: 10,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B1B1B',
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#2B2B2B',
  },
  selectedCard: { borderColor: '#DBB957' },
  planIcon: {
    width: 43,
    height: 43,
    borderRadius: 12,
    backgroundColor: '#302A19',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: { color: '#FFF', fontSize: 14, fontWeight: '700', marginBottom: 5 },
  selectedPlanBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#242116',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  selectedPlanText: { color: '#FFF', fontSize: 12, flex: 1 },
  changeText: { color: '#DBB957', fontWeight: '700', fontSize: 12 },
  choosePlanButton: { marginBottom: 16, padding: 12, backgroundColor: '#1B1B1B', borderRadius: 10 },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    backgroundColor: '#1B1B1B',
    borderRadius: 14,
    marginBottom: 10,
  },
  exerciseIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#302A19',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: '#DBB957',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
