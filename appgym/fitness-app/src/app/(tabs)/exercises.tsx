
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import { supabase } from '../../lib/supabase';

type Exercise = {
  id: string;
  name: string;
  muscle_group: string;
  equipment: string | null;
  image_url: string | null;
  video_url: string | null;
  instructions: string | null;
};

type Plan = {
  id: string;
  name: string;
  description: string | null;
};

type PlanExercise = {
  id: string;
  exercise_id: string;
  position: number;
  target_sets: number;
  target_reps_min: number;
  target_reps_max: number;
  rest_seconds: number;
  exercise: Exercise;
};

type TrainingSet = {
  id: string;
  set_number: number;
  weight_kg: number;
  reps: number;
  completed: boolean;
};

type ActiveExercise = {
  id: string;
  exercise_name: string;
  position: number;
  sets: TrainingSet[];
};

function ExerciseVideo({ url }: { url: string }) {
  const player = useVideoPlayer(url, (videoPlayer) => {
    videoPlayer.loop = false;
  });

  return (
    <VideoView
      player={player}
      style={styles.video}
      nativeControls
      contentFit="contain"
    />
  );
}

export default function TrainScreen() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [planExercises, setPlanExercises] = useState<PlanExercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [search, setSearch] = useState('');
  const [planName, setPlanName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeSessionName, setActiveSessionName] = useState('');
  const [activeExercises, setActiveExercises] = useState<ActiveExercise[]>([]);

  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId);

  const loadData = useCallback(async () => {
    setLoading(true);

    const [planResult, exerciseResult] = await Promise.all([
      supabase
        .from('workout_plans')
        .select('id, name, description')
        .eq('is_archived', false)
        .order('created_at', { ascending: false }),
      supabase
        .from('exercises')
        .select('id, name, muscle_group, equipment, image_url, video_url, instructions')
        .order('muscle_group')
        .order('name'),
    ]);

    if (planResult.error) {
      Alert.alert('Erro nos planos', planResult.error.message);
    } else {
      setPlans(planResult.data ?? []);
    }

    if (exerciseResult.error) {
      Alert.alert('Erro nos exercícios', exerciseResult.error.message);
    } else {
      setExercises(exerciseResult.data ?? []);
    }

    setLoading(false);
  }, []);

  const loadPlanExercises = useCallback(async (planId: string) => {
    const { data, error } = await supabase
      .from('plan_exercises')
      .select(`
        id,
        exercise_id,
        position,
        target_sets,
        target_reps_min,
        target_reps_max,
        rest_seconds,
        exercises (
          id,
          name,
          muscle_group,
          equipment,
          image_url,
          video_url,
          instructions
        )
      `)
      .eq('plan_id', planId)
      .order('position');

    if (error) {
      Alert.alert('Erro ao carregar o plano', error.message);
      return;
    }

    const normalized: PlanExercise[] = (data ?? [])
      .map((item: any) => ({
        id: item.id,
        exercise_id: item.exercise_id,
        position: item.position,
        target_sets: item.target_sets,
        target_reps_min: item.target_reps_min,
        target_reps_max: item.target_reps_max,
        rest_seconds: item.rest_seconds,
        exercise: Array.isArray(item.exercises)
          ? item.exercises[0]
          : item.exercises,
      }))
      .filter((item) => item.exercise);

    setPlanExercises(normalized);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (selectedPlanId) {
      loadPlanExercises(selectedPlanId);
    } else {
      setPlanExercises([]);
    }
  }, [selectedPlanId, loadPlanExercises]);

  async function createPlan() {
    const name = planName.trim();

    if (!name) {
      Alert.alert('Nome em falta', 'Escreve um nome para o plano.');
      return;
    }

    setSaving(true);
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      setSaving(false);
      Alert.alert('Sessão necessária', 'Entra na tua conta e tenta novamente.');
      return;
    }

    const { data, error } = await supabase
      .from('workout_plans')
      .insert({ user_id: userData.user.id, name })
      .select('id, name, description')
      .single();

    setSaving(false);

    if (error) {
      Alert.alert('Erro ao criar plano', error.message);
      return;
    }

    setPlans((current) => [data, ...current]);
    setPlanName('');
    setSelectedPlanId(data.id);
    Alert.alert('Plano criado', 'Agora podes escolher os exercícios.');
  }

  async function addExercise(exercise: Exercise) {
    if (!selectedPlanId) {
      Alert.alert('Escolhe um plano', 'Cria ou seleciona um plano primeiro.');
      return;
    }

    const existing = planExercises.find(
      (item) => item.exercise_id === exercise.id,
    );

    if (existing) {
      const { error } = await supabase
        .from('plan_exercises')
        .delete()
        .eq('id', existing.id);

      if (error) {
        Alert.alert('Erro ao remover', error.message);
        return;
      }

      await loadPlanExercises(selectedPlanId);
      return;
    }

    const nextPosition = planExercises.length
      ? Math.max(...planExercises.map((item) => item.position)) + 1
      : 0;

    const { error } = await supabase.from('plan_exercises').insert({
      plan_id: selectedPlanId,
      exercise_id: exercise.id,
      position: nextPosition,
      target_sets: 3,
      target_reps_min: 8,
      target_reps_max: 12,
      rest_seconds: 90,
    });

    if (error) {
      Alert.alert('Erro ao adicionar exercício', error.message);
      return;
    }

    await loadPlanExercises(selectedPlanId);
  }

  async function moveExercise(index: number, direction: -1 | 1) {
    if (!selectedPlanId) return;

    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= planExercises.length) return;

    const reordered = [...planExercises];
    [reordered[index], reordered[newIndex]] = [
      reordered[newIndex],
      reordered[index],
    ];

    setPlanExercises(reordered);

    for (let i = 0; i < reordered.length; i++) {
      const { error } = await supabase
        .from('plan_exercises')
        .update({ position: i })
        .eq('id', reordered[i].id);

      if (error) {
        Alert.alert('Erro ao organizar', error.message);
        await loadPlanExercises(selectedPlanId);
        return;
      }
    }

    await loadPlanExercises(selectedPlanId);
  }

  async function updateTarget(
    item: PlanExercise,
    field: 'target_sets' | 'target_reps_min' | 'target_reps_max' | 'rest_seconds',
    value: number,
  ) {
    const { error } = await supabase
      .from('plan_exercises')
      .update({ [field]: value })
      .eq('id', item.id);

    if (error) {
      Alert.alert('Erro ao guardar', error.message);
      return;
    }

    await loadPlanExercises(selectedPlanId!);
  }

  async function startWorkout() {
    if (!selectedPlanId || !selectedPlan || planExercises.length === 0) {
      Alert.alert('Plano vazio', 'Adiciona pelo menos um exercício ao plano.');
      return;
    }

    setSaving(true);

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      setSaving(false);
      Alert.alert('Sessão necessária', 'Entra na tua conta e tenta novamente.');
      return;
    }

    const { data: session, error: sessionError } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: userData.user.id,
        plan_id: selectedPlanId,
        name: selectedPlan.name,
        status: 'in_progress',
      })
      .select('id')
      .single();

    if (sessionError || !session) {
      setSaving(false);
      Alert.alert('Erro ao iniciar treino', sessionError?.message ?? 'Tenta novamente.');
      return;
    }

    const sessionExerciseRows = planExercises.map((item, index) => ({
      session_id: session.id,
      exercise_id: item.exercise_id,
      exercise_name: item.exercise.name,
      position: index,
    }));

    const { data: createdExercises, error: exercisesError } = await supabase
      .from('session_exercises')
      .insert(sessionExerciseRows)
      .select('id, exercise_name, position');

    if (exercisesError || !createdExercises) {
      await supabase
        .from('workout_sessions')
        .update({ status: 'cancelled', finished_at: new Date().toISOString() })
        .eq('id', session.id);

      setSaving(false);
      Alert.alert('Erro ao preparar exercícios', exercisesError?.message ?? 'Tenta novamente.');
      return;
    }

    const setRows = createdExercises.flatMap((created) => {
      const planItem = planExercises.find(
        (item) => item.exercise_id === sessionExerciseRows[created.position]?.exercise_id,
      );
      const numberOfSets = planItem?.target_sets ?? 3;
      const targetReps = planItem?.target_reps_min ?? 8;

      return Array.from({ length: numberOfSets }, (_, index) => ({
        session_exercise_id: created.id,
        set_number: index + 1,
        weight_kg: 0,
        reps: targetReps,
        completed: false,
      }));
    });

    const { data: createdSets, error: setsError } = await supabase
      .from('workout_sets')
      .insert(setRows)
      .select('id, session_exercise_id, set_number, weight_kg, reps, completed');

    setSaving(false);

    if (setsError || !createdSets) {
      Alert.alert(
        'Treino criado parcialmente',
        'A sessão foi criada, mas as séries não foram guardadas. Verifica a ligação e tenta novamente.',
      );
      return;
    }

    setActiveSessionId(session.id);
    setActiveSessionName(selectedPlan.name);
    setActiveExercises(
      createdExercises
        .sort((a, b) => a.position - b.position)
        .map((created) => ({
          id: created.id,
          exercise_name: created.exercise_name,
          position: created.position,
          sets: createdSets
            .filter((set) => set.session_exercise_id === created.id)
            .sort((a, b) => a.set_number - b.set_number),
        })),
    );
  }

  async function updateSet(
    exerciseId: string,
    set: TrainingSet,
    changes: Partial<TrainingSet>,
  ) {
    const { error } = await supabase
      .from('workout_sets')
      .update(changes)
      .eq('id', set.id);

    if (error) {
      Alert.alert('Erro ao guardar série', error.message);
      return;
    }

    setActiveExercises((current) =>
      current.map((exercise) =>
        exercise.id !== exerciseId
          ? exercise
          : {
              ...exercise,
              sets: exercise.sets.map((row) =>
                row.id === set.id ? { ...row, ...changes } : row,
              ),
            },
      ),
    );
  }

  async function addSet(exercise: ActiveExercise) {
    const nextNumber = exercise.sets.length
      ? Math.max(...exercise.sets.map((set) => set.set_number)) + 1
      : 1;

    const { data, error } = await supabase
      .from('workout_sets')
      .insert({
        session_exercise_id: exercise.id,
        set_number: nextNumber,
        weight_kg: 0,
        reps: 8,
        completed: false,
      })
      .select('id, set_number, weight_kg, reps, completed')
      .single();

    if (error) {
      Alert.alert('Erro ao adicionar série', error.message);
      return;
    }

    setActiveExercises((current) =>
      current.map((item) =>
        item.id === exercise.id
          ? { ...item, sets: [...item.sets, data] }
          : item,
      ),
    );
  }

  async function finishWorkout() {
    if (!activeSessionId) return;

    const { error } = await supabase
      .from('workout_sessions')
      .update({
        status: 'completed',
        finished_at: new Date().toISOString(),
      })
      .eq('id', activeSessionId);

    if (error) {
      Alert.alert('Erro ao terminar treino', error.message);
      return;
    }

    Alert.alert('Treino concluído!', 'A tua sessão ficou guardada no histórico.');
    setActiveSessionId(null);
    setActiveExercises([]);
  }

  const filteredExercises = exercises.filter((exercise) =>
    `${exercise.name} ${exercise.muscle_group} ${exercise.equipment ?? ''}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#DBB957" />
        <Text style={styles.muted}>A carregar os treinos...</Text>
      </View>
    );
  }

  if (activeSessionId) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() =>
              Alert.alert(
                'Treino em curso',
                'Queres sair deste ecrã? A sessão continuará em curso.',
                [{ text: 'Ficar', style: 'cancel' }, { text: 'Sair', onPress: () => setActiveSessionId(null) }],
              )
            }
          >
            <Ionicons name="chevron-back" size={22} color="#DBB957" />
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>

          <Text style={styles.brand}>APPGYM · TREINO ATIVO</Text>
          <Text style={styles.title}>{activeSessionName}</Text>
          <Text style={styles.subtitle}>
            Regista o peso e as repetições de cada série. Marca a série quando terminares.
          </Text>

          {activeExercises.map((exercise) => (
            <View key={exercise.id} style={styles.sessionCard}>
              <Text style={styles.cardTitle}>{exercise.exercise_name}</Text>
              <View style={styles.setHeader}>
                <Text style={styles.setHeaderText}>Série</Text>
                <Text style={styles.setHeaderText}>Peso (kg)</Text>
                <Text style={styles.setHeaderText}>Reps</Text>
                <Text style={styles.setHeaderText}>Feita</Text>
              </View>

              {exercise.sets.map((set) => (
                <View key={set.id} style={styles.setRow}>
                  <Text style={styles.setNumber}>{set.set_number}</Text>
                  <TextInput
                    style={styles.setInput}
                    keyboardType="decimal-pad"
                    defaultValue={String(set.weight_kg)}
                    onEndEditing={(event) => {
                      const value = Number(event.nativeEvent.text.replace(',', '.'));
                      if (Number.isFinite(value) && value >= 0 && value !== set.weight_kg) {
                        updateSet(exercise.id, set, { weight_kg: value });
                      }
                    }}
                  />
                  <TextInput
                    style={styles.setInput}
                    keyboardType="number-pad"
                    defaultValue={String(set.reps)}
                    onEndEditing={(event) => {
                      const value = Number(event.nativeEvent.text);
                      if (Number.isInteger(value) && value >= 0 && value !== set.reps) {
                        updateSet(exercise.id, set, { reps: value });
                      }
                    }}
                  />
                  <TouchableOpacity
                    style={[styles.checkButton, set.completed && styles.checkedButton]}
                    onPress={() => updateSet(exercise.id, set, { completed: !set.completed })}
                  >
                    <Ionicons
                      name={set.completed ? 'checkmark' : 'ellipse-outline'}
                      size={22}
                      color={set.completed ? '#111' : '#DBB957'}
                    />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity style={styles.secondaryButton} onPress={() => addSet(exercise)}>
                <Ionicons name="add" size={18} color="#DBB957" />
                <Text style={styles.secondaryButtonText}>Adicionar série</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.primaryButton} onPress={finishWorkout}>
            <Ionicons name="checkmark-circle-outline" size={21} color="#111" />
            <Text style={styles.primaryButtonText}>Terminar treino</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (selectedExercise) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedExercise(null)}
          >
            <Ionicons name="chevron-back" size={22} color="#DBB957" />
            <Text style={styles.backButtonText}>Voltar à biblioteca</Text>
          </TouchableOpacity>

          <Text style={styles.brand}>APPGYM · EXERCÍCIO</Text>
          <Text style={styles.title}>{selectedExercise.name}</Text>
          <Text style={styles.subtitle}>
            {selectedExercise.muscle_group}
            {selectedExercise.equipment ? ` · ${selectedExercise.equipment}` : ''}
          </Text>

          {selectedExercise.image_url ? (
            <Image
              source={{ uri: selectedExercise.image_url }}
              style={styles.detailImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="barbell-outline" size={58} color="#DBB957" />
              <Text style={styles.muted}>Ainda não foi adicionada uma imagem</Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>Como executar</Text>
          <Text style={styles.instructionText}>
            {selectedExercise.instructions?.trim() ||
              'As instruções deste exercício ainda não foram adicionadas.'}
          </Text>

          <Text style={styles.sectionTitle}>Vídeo demonstrativo</Text>
          {selectedExercise.video_url ? (
            <ExerciseVideo url={selectedExercise.video_url} />
          ) : (
            <View style={styles.videoPlaceholder}>
              <Ionicons name="videocam-outline" size={35} color="#DBB957" />
              <Text style={styles.muted}>Ainda não foi adicionado um vídeo</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              setSelectedExercise(null);
              addExercise(selectedExercise);
            }}
          >
            <Ionicons
              name={selectedPlanId && planExercises.some((item) => item.exercise_id === selectedExercise.id) ? 'remove' : 'add'}
              size={21}
              color="#111"
            />
            <Text style={styles.primaryButtonText}>
              {selectedPlanId && planExercises.some((item) => item.exercise_id === selectedExercise.id)
                ? 'Remover do plano'
                : 'Adicionar ao plano'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
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

        <Text style={styles.sectionTitle}>Criar plano</Text>
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

        <Text style={styles.sectionTitle}>Os meus planos</Text>
        {plans.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="clipboard-outline" size={36} color="#DBB957" />
            <Text style={styles.cardTitle}>Ainda não tens planos</Text>
            <Text style={styles.muted}>Cria o teu primeiro plano acima.</Text>
          </View>
        ) : (
          plans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[styles.planCard, selectedPlanId === plan.id && styles.selectedCard]}
              onPress={() => setSelectedPlanId(plan.id)}
            >
              <View style={styles.planIcon}>
                <Ionicons name="barbell" size={22} color="#DBB957" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{plan.name}</Text>
                <Text style={styles.muted}>
                  {selectedPlanId === plan.id
                    ? `${planExercises.length} exercícios neste plano`
                    : 'Toca para escolher exercícios'}
                </Text>
              </View>
              <Ionicons
                name={selectedPlanId === plan.id ? 'checkmark-circle' : 'chevron-forward'}
                size={22}
                color="#DBB957"
              />
            </TouchableOpacity>
          ))
        )}

        {selectedPlan && (
          <>
            <Text style={styles.sectionTitle}>Organizar: {selectedPlan.name}</Text>
            <Text style={styles.muted}>
              Usa as setas para alterar a ordem. Podes ajustar séries, repetições e descanso.
            </Text>

            {planExercises.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.muted}>Ainda não adicionaste exercícios a este plano.</Text>
              </View>
            ) : (
              planExercises.map((item, index) => (
                <View key={item.id} style={styles.selectedExerciseCard}>
                  {item.exercise.image_url ? (
                    <Image
                      source={{ uri: item.exercise.image_url }}
                      style={styles.thumbnail}
                    />
                  ) : (
                    <View style={styles.thumbnailPlaceholder}>
                      <Ionicons name="barbell-outline" size={24} color="#DBB957" />
                    </View>
                  )}

                  <View style={{ flex: 1 }}>
                    <TouchableOpacity onPress={() => setSelectedExercise(item.exercise)}>
                      <Text style={styles.cardTitle}>{index + 1}. {item.exercise.name}</Text>
                      <Text style={styles.muted}>{item.exercise.muscle_group} · Ver detalhes</Text>
                    </TouchableOpacity>

                    <View style={styles.targetRow}>
                      <TextInput
                        style={styles.targetInput}
                        keyboardType="number-pad"
                        defaultValue={String(item.target_sets)}
                        onEndEditing={(event) => {
                          const value = Number(event.nativeEvent.text);
                          if (Number.isInteger(value) && value >= 1 && value <= 20 && value !== item.target_sets) {
                            updateTarget(item, 'target_sets', value);
                          }
                        }}
                      />
                      <Text style={styles.targetLabel}>séries</Text>
                      <TextInput
                        style={styles.targetInput}
                        keyboardType="number-pad"
                        defaultValue={String(item.target_reps_min)}
                        onEndEditing={(event) => {
                          const value = Number(event.nativeEvent.text);
                          if (Number.isInteger(value) && value >= 1 && value <= item.target_reps_max && value !== item.target_reps_min) {
                            updateTarget(item, 'target_reps_min', value);
                          }
                        }}
                      />
                      <Text style={styles.targetLabel}>a</Text>
                      <TextInput
                        style={styles.targetInput}
                        keyboardType="number-pad"
                        defaultValue={String(item.target_reps_max)}
                        onEndEditing={(event) => {
                          const value = Number(event.nativeEvent.text);
                          if (Number.isInteger(value) && value >= item.target_reps_min && value <= 100 && value !== item.target_reps_max) {
                            updateTarget(item, 'target_reps_max', value);
                          }
                        }}
                      />
                      <Text style={styles.targetLabel}>reps</Text>
                    </View>
                    <Text style={styles.muted}>Descanso: {item.rest_seconds} segundos</Text>
                  </View>

                  <View style={styles.orderButtons}>
                    <TouchableOpacity
                      onPress={() => moveExercise(index, -1)}
                      disabled={index === 0}
                    >
                      <Ionicons
                        name="chevron-up"
                        size={22}
                        color={index === 0 ? '#555' : '#DBB957'}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => moveExercise(index, 1)}
                      disabled={index === planExercises.length - 1}
                    >
                      <Ionicons
                        name="chevron-down"
                        size={22}
                        color={index === planExercises.length - 1 ? '#555' : '#DBB957'}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}

            {planExercises.length > 0 && (
              <TouchableOpacity
                style={[styles.primaryButton, saving && styles.disabledButton]}
                onPress={startWorkout}
                disabled={saving}
              >
                <Ionicons name="play-circle-outline" size={22} color="#111" />
                <Text style={styles.primaryButtonText}>
                  {saving ? 'A preparar treino...' : 'Começar treino'}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}

        <Text style={styles.sectionTitle}>Biblioteca de exercícios</Text>
        <TextInput
          style={styles.input}
          placeholder="Pesquisar exercício ou músculo..."
          placeholderTextColor="#777"
          value={search}
          onChangeText={setSearch}
        />

        {filteredExercises.map((exercise) => {
          const added = planExercises.some((item) => item.exercise_id === exercise.id);

          return (
            <TouchableOpacity
              key={exercise.id}
              style={styles.exerciseCard}
              onPress={() => setSelectedExercise(exercise)}
              activeOpacity={0.8}
            >
              {exercise.image_url ? (
                <Image
                  source={{ uri: exercise.image_url }}
                  style={styles.thumbnail}
                />
              ) : (
                <View style={styles.thumbnailPlaceholder}>
                  <Ionicons name="barbell-outline" size={24} color="#DBB957" />
                </View>
              )}

              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{exercise.name}</Text>
                <Text style={styles.muted}>
                  {exercise.muscle_group}
                  {exercise.equipment ? ` · ${exercise.equipment}` : ''}
                </Text>
                <Text style={styles.detailsLink}>Ver imagem e vídeo</Text>
              </View>

              <TouchableOpacity
                style={[styles.addButton, added && styles.removeButton]}
                onPress={() => addExercise(exercise)}
                disabled={!selectedPlanId}
              >
                <Ionicons
                  name={added ? 'remove' : 'add'}
                  size={23}
                  color={selectedPlanId ? (added ? '#DBB957' : '#111') : '#777'}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}

        {filteredExercises.length === 0 && (
          <Text style={styles.muted}>Não foram encontrados exercícios.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#101010' },
  content: { paddingHorizontal: 18, paddingTop: 55, paddingBottom: 45 },
  center: {
    flex: 1, backgroundColor: '#101010', justifyContent: 'center',
    alignItems: 'center', gap: 12,
  },
  brand: { color: '#DBB957', fontSize: 12, fontWeight: '800', letterSpacing: 3 },
  title: { color: '#FFF', fontSize: 30, fontWeight: '800', marginTop: 8 },
  subtitle: { color: '#999', fontSize: 14, marginTop: 6, lineHeight: 21, marginBottom: 22 },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: '800', marginTop: 23, marginBottom: 12 },
  muted: { color: '#999', fontSize: 12, lineHeight: 18 },
  input: {
    backgroundColor: '#1B1B1B', borderWidth: 1, borderColor: '#333',
    color: '#FFF', borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 13, fontSize: 14, marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#DBB957', padding: 15, borderRadius: 12,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 8, marginTop: 12, marginBottom: 14,
  },
  primaryButtonText: { color: '#111', fontWeight: '800', fontSize: 14 },
  disabledButton: { opacity: 0.6 },
  planCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1B1B1B',
    padding: 13, borderRadius: 14, marginBottom: 10, gap: 12,
    borderWidth: 1, borderColor: '#2B2B2B',
  },
  selectedCard: { borderColor: '#DBB957' },
  planIcon: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: '#302A19',
    justifyContent: 'center', alignItems: 'center',
  },
  cardTitle: { color: '#FFF', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  emptyCard: {
    backgroundColor: '#1B1B1B', padding: 22, alignItems: 'center',
    borderRadius: 15, gap: 9, marginBottom: 12,
  },
  exerciseCard: {
    flexDirection: 'row', alignItems: 'center', gap: 11, padding: 11,
    backgroundColor: '#1B1B1B', borderRadius: 14, marginBottom: 10,
  },
  thumbnail: { width: 65, height: 65, borderRadius: 10, backgroundColor: '#292929' },
  thumbnailPlaceholder: {
    width: 65, height: 65, borderRadius: 10, backgroundColor: '#302A19',
    alignItems: 'center', justifyContent: 'center',
  },
  addButton: {
    width: 36, height: 36, borderRadius: 11, backgroundColor: '#DBB957',
    alignItems: 'center', justifyContent: 'center',
  },
  removeButton: { backgroundColor: '#302A19', borderWidth: 1, borderColor: '#DBB957' },
  detailsLink: { color: '#DBB957', fontSize: 11, marginTop: 5, fontWeight: '600' },
  selectedExerciseCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 11,
    backgroundColor: '#1B1B1B', borderRadius: 14, marginTop: 10,
  },
  targetRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, marginBottom: 5 },
  targetInput: {
    minWidth: 31, textAlign: 'center', color: '#FFF', backgroundColor: '#292929',
    borderRadius: 6, paddingHorizontal: 4, paddingVertical: 5, fontSize: 12,
  },
  targetLabel: { color: '#999', fontSize: 10 },
  orderButtons: { justifyContent: 'center', gap: 8, paddingLeft: 3 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 20 },
  backButtonText: { color: '#DBB957', fontSize: 14, fontWeight: '600' },
  detailImage: { width: '100%', height: 245, borderRadius: 15, backgroundColor: '#292929', marginBottom: 8 },
  imagePlaceholder: {
    width: '100%', height: 200, borderRadius: 15, backgroundColor: '#1B1B1B',
    alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8,
  },
  instructionText: { color: '#DDD', fontSize: 14, lineHeight: 22, marginBottom: 8 },
  video: { width: '100%', height: 220, borderRadius: 12, backgroundColor: '#000' },
  videoPlaceholder: {
    height: 145, borderRadius: 12, backgroundColor: '#1B1B1B',
    alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  sessionCard: {
    backgroundColor: '#1B1B1B', borderRadius: 14, padding: 13, marginBottom: 15,
  },
  setHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 14, marginBottom: 6,
  },
  setHeaderText: { color: '#999', fontSize: 10, flex: 1, textAlign: 'center' },
  setRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: 5, paddingVertical: 7, borderTopWidth: 1, borderTopColor: '#303030',
  },
  setNumber: { color: '#FFF', flex: 1, textAlign: 'center', fontWeight: '700' },
  setInput: {
    flex: 1, backgroundColor: '#292929', color: '#FFF', borderRadius: 7,
    paddingVertical: 8, paddingHorizontal: 4, textAlign: 'center', fontSize: 13,
  },
  checkButton: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 5,
  },
  checkedButton: { backgroundColor: '#DBB957', borderRadius: 8 },
  secondaryButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, marginTop: 10, padding: 10, borderRadius: 9,
    borderWidth: 1, borderColor: '#49402A',
  },
  secondaryButtonText: { color: '#DBB957', fontWeight: '700', fontSize: 12 },
});
