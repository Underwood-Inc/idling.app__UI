import type { ProductTechStackItem } from './productTechStackCatalog';

interface ProductTechStackProps {
  items: ProductTechStackItem[];
}

export function ProductTechStack({ items }: ProductTechStackProps) {
  return (
    <div className="product-tech" data-testid="product-tech-stack">
      {items.map((item) => (
        <a
          key={item.label}
          href={item.href}
          className="product-tech__tag"
          target="_blank"
          rel="noopener noreferrer"
          data-testid="product-tech-link"
          aria-label={`${item.label} — official documentation (opens in a new tab)`}
        >
          <span className="product-tech__tagLabel">{item.label}</span>
          <span className="product-tech__tagExternal" aria-hidden="true" title="Opens in new tab">
            ↗
          </span>
        </a>
      ))}
    </div>
  );
}
