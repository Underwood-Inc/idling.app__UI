import { render, screen } from '@testing-library/react';
import { ProductTechStack } from './ProductTechStack';

test('built-with pills are native anchor links with href (not button or onClick navigation)', () => {
  render(
    <ProductTechStack
      items={[
        { label: 'React 19', href: 'https://react.dev/' },
        { label: 'TypeScript', href: 'https://www.typescriptlang.org/' },
      ]}
    />
  );

  const links = screen.getAllByTestId('product-tech-link');

  expect(links).toHaveLength(2);
  for (const link of links) {
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href');
    expect(link.getAttribute('href')).toMatch(/^https:\/\//);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  }

  expect(screen.getByRole('link', { name: /React 19/i })).toHaveAttribute('href', 'https://react.dev/');
});