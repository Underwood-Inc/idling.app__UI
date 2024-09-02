import { EMPTY_SELECTORS } from 'src/lib/test-selectors/components/empty.selectors';
import './Empty.css';

export default function Empty({ label = '' }: { label: string }) {
  return (
    <div className="empty" data-testid={EMPTY_SELECTORS.CONTAINER}>
      <p data-testid={EMPTY_SELECTORS.LABEL}>
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
