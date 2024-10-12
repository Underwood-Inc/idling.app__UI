import { Suspense } from 'react';
import CommentForm from 'src/app/components/comment/CommentForm';
import CommentList from 'src/app/components/comment/CommentList';
import PostItem from 'src/app/components/post/PostItem';
import { getComments } from 'src/lib/actions/comment.actions';
import { getPost } from 'src/lib/actions/post.actions';

export default async function PostPage({
  params
}: {
  params: { postId: string };
}) {
  const post = await getPost(params.postId);
  const comments = await getComments(params.postId);

  if (!post) {
    return <div>Post not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PostItem post={post} />
      <CommentForm postId={post.id} />
      <Suspense fallback={<div>Loading comments...</div>}>
        <CommentList comments={comments} />
      </Suspense>
    </div>
  );
}
