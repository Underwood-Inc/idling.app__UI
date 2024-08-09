'use client';
import { ScaleLoader } from 'react-spinners';
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
      <ScaleLoader color={color} />
    </div>
  );
}
