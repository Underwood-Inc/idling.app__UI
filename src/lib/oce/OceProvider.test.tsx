// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { OCE } from './OCE';
import { OceProvider, useOceFetch, useOceSnapshot } from './OceProvider';

function Probe() {
  const fetchImpl = useOceFetch();
  const unavailable = useOceSnapshot().unavailable;
  return (
    <>
      <span data-testid="fetch">{fetchImpl === OCE.fetch ? 'yes' : 'no'}</span>
      <span data-testid="unavailable">{unavailable ? 'yes' : 'no'}</span>
    </>
  );
}

describe('OceProvider', () => {
  test('useOceFetch is OCE.fetch', () => {
    render(
      <OceProvider>
        <Probe />
      </OceProvider>
    );
    expect(screen.getByTestId('fetch').textContent).toBe('yes');
  });
});