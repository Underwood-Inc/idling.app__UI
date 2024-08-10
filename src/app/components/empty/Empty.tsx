import './Empty.css';

export default function Empty({ label = '' }: { label: string }) {
  return (
    <div className="empty">
      <p>
        {label && (
          <>
            {label}
            <br />
          </>
        )}
        ＞︿＜
      </p>
    </div>
  );
}
