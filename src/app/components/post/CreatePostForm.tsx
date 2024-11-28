'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createPost } from 'src/lib/actions/post.actions';

export default function CreatePostForm({ subthread }: { subthread: string }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [subThread, setSubthread] = useState('');
  const router = useRouter();
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const post = await createPost({
        title,
        content,
        subthread: subthread ?? subThread
      });
      router.push(`/t/${post.subthread}/comments/${post.id}`);
    } catch (error) {
      console.error('Error creating post:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'An error occurred while creating the post'
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block mb-1">
          Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
      </div>
      <div>
        <label htmlFor="content" className="block mb-1">
          Content
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
      </div>
      {!subthread && (
        <div>
          <label htmlFor="subthread" className="block mb-1">
            Subthread
          </label>
          <input
            type="text"
            id="subthread"
            value={subThread}
            onChange={(e) => setSubthread(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
      )}
      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Create Post
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </form>
  );
}
