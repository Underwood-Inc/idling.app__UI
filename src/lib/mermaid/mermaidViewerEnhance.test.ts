import { enhanceMermaidDiagrams } from './mermaidViewer';

function installBBox(): void {
  const box = { x: 0, y: 0, width: 200, height: 80 };
  Object.defineProperty(Element.prototype, 'getBBox', {
    configurable: true,
    value: () => box,
  });
}

test('docusaurus mermaid container becomes an interactive viewer once an svg exists', () => {
  installBBox();

  document.body.innerHTML = `
    <div class="docusaurus-mermaid-container">
      <svg viewBox="0 0 200 80"><g></g></svg>
    </div>
  `;

  enhanceMermaidDiagrams(document);
  enhanceMermaidDiagrams(document);

  const diagram = document.querySelector('.docusaurus-mermaid-container');
  const wrapper = diagram?.closest('.mermaid-container');

  expect(diagram).toHaveAttribute('data-enhanced', 'true');
  expect(diagram?.classList.contains('mermaid')).toBe(true);
  expect(wrapper).toHaveAttribute('data-mermaid-interactive', 'true');
  expect(wrapper?.querySelector('.mermaid-controls')).not.toBeNull();
  expect(wrapper?.querySelectorAll('.mermaid-control-btn').length).toBeGreaterThan(0);
  expect(document.querySelectorAll('.mermaid-container')).toHaveLength(1);
});

test('docusaurus mermaid container stays unmarked until an svg child exists', () => {
  document.body.innerHTML = '<div class="docusaurus-mermaid-container"></div>';

  enhanceMermaidDiagrams(document);

  const diagram = document.querySelector('.docusaurus-mermaid-container');
  expect(diagram?.hasAttribute('data-enhanced')).toBe(false);
  expect(diagram?.closest('.mermaid-container')).toBeNull();
});
