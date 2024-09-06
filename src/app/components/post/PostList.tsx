'use client';

import { useEffect, useState } from 'react';
import { getPosts } from 'src/lib/actions/post.actions';
import { Post } from 'src/lib/schemas/post.schemas';
import PostItem from './PostItem';

interface PostListProps {
  subthread?: string;
}

export default function PostList({ subthread }: PostListProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const fetchedPosts = await getPosts(subthread);
        setPosts(fetchedPosts);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    }

    debugger;
    if (subthread) {
      fetchPosts();
    }
  }, [subthread]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <ul className="space-y-4">
      {posts.map((post) => (
        <PostItem key={post.id} post={post} />
      ))}
    </ul>
  );
}
