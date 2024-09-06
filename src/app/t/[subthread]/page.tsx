import { Suspense } from 'react';
import CreatePostForm from 'src/app/components/post/CreatePostForm';
import PostList from 'src/app/components/post/PostList';

export default function SubthreadPage({
  params
}: {
  params: { subthread: string };
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">t/{params.subthread}</h1>

      <Suspense fallback={<div>Loading posts...</div>}>
        <PostList subthread={params.subthread} />
      </Suspense>

      <CreatePostForm subthread={params.subthread} />
    </div>
  );
}
