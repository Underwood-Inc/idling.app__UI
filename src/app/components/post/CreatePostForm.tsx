'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createPost } from 'src/lib/actions/post.actions';
import './CreatePostForm.css';

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
    <form onSubmit={handleSubmit} className="create-post-form">
      <div className="create-post-form__field">
        <label htmlFor="title" className="create-post-form__label">
          Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="create-post-form__input"
        />
      </div>
      <div className="create-post-form__field">
        <label htmlFor="content" className="create-post-form__label">
          Content
        </label>
        <textarea
          id="content"
          name="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          className="create-post-form__textarea"
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
      <button type="submit" className="create-post-form__submit">
        Create Post
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </form>
  );
}
