
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

const GOLD = '#DBB957';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>APPGYM</Text>
          <Text style={styles.greeting}>BORA TREINAR.</Text>
          <Text style={styles.subtitle}>A tua evolução começa hoje.</Text>
        </View>

        <Pressable
          style={styles.avatar}
          onPress={() => router.push('/profile')}
        >
          <Text style={styles.avatarText}>A</Text>
        </Pressable>
      </View>

      <View style={styles.hero}>
        <Text style={styles.eyebrow}>O TEU OBJETIVO</Text>
        <Text style={styles.heroTitle}>SEM DESCULPAS.</Text>
        <Text style={styles.heroSubtitle}>
          Cada treino conta. Mantém a consistência.
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() => router.push('/exercises')}
        >
          <Text style={styles.primaryButtonText}>EXPLORAR EXERCÍCIOS  →</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>O TEU RESUMO</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>⚡</Text>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Treinos esta semana</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🏆</Text>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Objetivos concluídos</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>O TEU PRÓXIMO PASSO</Text>

      <Pressable
        style={styles.listCard}
        onPress={() => router.push('/calendar')}
      >
        <View style={styles.cardIcon}>
          <Text style={styles.cardIconText}>▦</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>Planeia a tua semana</Text>
          <Text style={styles.cardSubtitle}>
            Organiza os teus próximos treinos.
          </Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </Pressable>

      <Pressable
        style={styles.listCard}
        onPress={() => router.push('/coach')}
      >
        <View style={styles.cardIcon}>
          <Text style={styles.cardIconText}>✦</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>Conhece o AI Coach</Text>
          <Text style={styles.cardSubtitle}>
            Prepara-te para treinar com um plano personalizado.
          </Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </Pressable>

      <Text style={styles.footer}>CONSISTÊNCIA ACIMA DE TUDO.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090909',
  },
  content: {
    padding: 22,
    paddingTop: 60,
    paddingBottom: 35,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  brand: {
    color: GOLD,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: 15,
  },
  greeting: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    color: '#999999',
    fontSize: 13,
    marginTop: 7,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#242424',
    borderWidth: 1,
    borderColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: GOLD,
    fontSize: 19,
    fontWeight: '800',
  },
  hero: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 20,
    padding: 22,
    marginBottom: 30,
  },
  eyebrow: {
    color: GOLD,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    marginTop: 14,
  },
  heroSubtitle: {
    color: '#AAAAAA',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 9,
    marginBottom: 22,
  },
  primaryButton: {
    backgroundColor: GOLD,
    paddingVertical: 15,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#080808',
    fontSize: 12,
    fontWeight: '900',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#151515',
    borderRadius: 15,
    padding: 16,
    borderWidth: 1,
    borderColor: '#292929',
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 14,
  },
  statValue: {
    color: GOLD,
    fontSize: 28,
    fontWeight: '900',
  },
  statLabel: {
    color: '#999999',
    fontSize: 11,
    marginTop: 5,
    lineHeight: 16,
  },
  listCard: {
    backgroundColor: '#151515',
    borderRadius: 14,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#292929',
  },
  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#29251A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconText: {
    color: GOLD,
    fontSize: 23,
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: '#999999',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 5,
  },
  arrow: {
    color: GOLD,
    fontSize: 26,
  },
  footer: {
    color: '#666666',
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 25,
  },
});