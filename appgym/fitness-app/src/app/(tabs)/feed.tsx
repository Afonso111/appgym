
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

type Post = {
  id: string;
  user_id: string;
  content: string | null;
  media_url: string | null;
  media_type: 'none' | 'image' | 'video';
  post_type: 'general' | 'workout' | 'achievement';
  created_at: string;
  profiles: {
    username: string | null;
    name: string;
    avatar_url: string | null;
  } | null;
};

export default function FeedScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadPosts = useCallback(async () => {
    setError('');

    const { data, error: requestError } = await supabase
      .from('posts')
      .select(`
        id,
        user_id,
        content,
        media_url,
        media_type,
        post_type,
        created_at,
        profiles (
          username,
          name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })
      .limit(30);

    if (requestError) {
      setError(requestError.message);
    } else {
      const result = (data ?? []).map((post: any) => ({
        ...post,
        profiles: Array.isArray(post.profiles)
          ? post.profiles[0] ?? null
          : post.profiles,
      })) as Post[];

      setPosts(result);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const refresh = () => {
    setRefreshing(true);
    loadPosts();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#DBB957" />
        <Text style={styles.muted}>A carregar o feed...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>APPGYM</Text>
          <Text style={styles.heading}>Comunidade</Text>
        </View>
        <Ionicons name="people-outline" size={28} color="#DBB957" />
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.error}>Não foi possível carregar o feed.</Text>
          <Text style={styles.muted}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor="#DBB957"
            />
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name="people-circle-outline"
                size={58}
                color="#DBB957"
              />
              <Text style={styles.emptyTitle}>A comunidade começa aqui</Text>
              <Text style={styles.muted}>
                Ainda não existem publicações visíveis. Sê o primeiro a
                partilhar o teu treino!
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.post}>
              <View style={styles.postHeader}>
                <View style={styles.avatar}>
                  {item.profiles?.avatar_url ? (
                    <Image
                      source={{ uri: item.profiles.avatar_url }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Ionicons
                      name="person"
                      size={22}
                      color="#DBB957"
                    />
                  )}
                </View>

                <View style={styles.author}>
                  <Text style={styles.authorName}>
                    {item.profiles?.name ?? 'Utilizador AppGym'}
                  </Text>
                  <Text style={styles.username}>
                    {item.profiles?.username
                      ? `@${item.profiles.username}`
                      : 'Membro da comunidade'}
                  </Text>
                </View>

                {item.post_type === 'workout' && (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>TREINO</Text>
                  </View>
                )}

                {item.post_type === 'achievement' && (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>CONQUISTA</Text>
                  </View>
                )}
              </View>

              {item.content ? (
                <Text style={styles.content}>{item.content}</Text>
              ) : null}

              {item.media_type === 'image' && item.media_url ? (
                <Image
                  source={{ uri: item.media_url }}
                  style={styles.postImage}
                  resizeMode="cover"
                />
              ) : null}

              {item.media_type === 'video' && (
                <View style={styles.videoPlaceholder}>
                  <Ionicons
                    name="videocam-outline"
                    size={30}
                    color="#DBB957"
                  />
                  <Text style={styles.muted}>
                    Publicação com vídeo
                  </Text>
                </View>
              )}

              <View style={styles.postFooter}>
                <Ionicons
                  name="barbell-outline"
                  size={18}
                  color="#DBB957"
                />
                <Text style={styles.date}>
                  {new Date(item.created_at).toLocaleDateString('pt-PT')}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101010',
    paddingTop: 55,
  },
  header: {
    paddingHorizontal: 22,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    color: '#DBB957',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 3,
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '800',
    marginTop: 5,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 30,
    flexGrow: 1,
  },
  post: {
    backgroundColor: '#1B1B1B',
    borderRadius: 18,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#2B2B2B',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
  },
  avatar: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: '#292929',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  author: {
    flex: 1,
    marginLeft: 11,
  },
  authorName: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  username: {
    color: '#999999',
    fontSize: 12,
    marginTop: 3,
  },
  content: {
    color: '#EEEEEE',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: '#292929',
  },
  videoPlaceholder: {
    height: 180,
    backgroundColor: '#292929',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  date: {
    color: '#999999',
    fontSize: 12,
  },
  tag: {
    backgroundColor: '#3A3320',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  tagText: {
    color: '#DBB957',
    fontSize: 9,
    fontWeight: '800',
  },
  center: {
    flex: 1,
    backgroundColor: '#101010',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
    gap: 12,
  },
  muted: {
    color: '#999999',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  error: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 35,
    gap: 12,
    minHeight: 350,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
  },
});
