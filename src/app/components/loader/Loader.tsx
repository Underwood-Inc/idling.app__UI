'use client';
import { ScaleLoader } from 'react-spinners';
import { LOADER_SELECTORS } from 'src/lib/test-selectors/components/loader.selectors';
import './Loader.css';

export default function Loader({
  label = 'Loading Data...',
  color = 'white'
}: {
  label?: string;
  color?: string;
}) {
  return (
    <div className="loader">
      {label && <p>{label}</p>}
      <ScaleLoader data-testid={LOADER_SELECTORS.LOADER} color={color} />
    </div>
  );
}
