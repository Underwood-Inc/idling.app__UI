'use client';
import { ScaleLoader } from 'react-spinners';
import './Loader.css';

export default function Loader() {
  return (
    <div className="loader">
      <p>Loading Data...</p>
      <ScaleLoader color="white" />
    </div>
  );
}
