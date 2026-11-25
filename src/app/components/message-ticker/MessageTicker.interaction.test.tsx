import { fireEvent, render } from '@testing-library/react';
import { test, expect, vi } from 'vitest';

import { MessageTicker } from './MessageTicker';

/**
 * @description Clicking the marquee region should request the full-quote overlay.
 */
test('[MT-003] when the user clicks the ticker, onQuoteOpen is invoked', () => {
  const onQuoteOpen = vi.fn();

  const { container } = render(
    <MessageTicker messages={['Short line']} onQuoteOpen={onQuoteOpen} />
  );

  const ticker = container.querySelector('.message-ticker__container');
  expect(ticker).toBeTruthy();
  fireEvent.click(ticker!);

  expect(onQuoteOpen).toHaveBeenCalledTimes(1);
});