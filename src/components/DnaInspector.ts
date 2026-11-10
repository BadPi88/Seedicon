import type { AvatarDNA } from '../engine/renderer';

class DnaInspector extends HTMLElement {
  #grid: HTMLDListElement;

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `
      <style>
        :host { display: block; }
        section { padding: 18px; border: 1px solid #292e39; border-radius: 10px; background: #171b24; }
        h2 { margin: 0 0 14px; color: #f4f5f7; font: 700 13px system-ui, sans-serif; }
        dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 0; }
        div { min-width: 0; }
        dt { margin-bottom: 5px; color: #858d9c; font: 10px ui-monospace, monospace; text-transform: uppercase; letter-spacing: .08em; }
        dd { overflow: hidden; margin: 0; color: #e8ebef; font: 12px ui-monospace, monospace; text-overflow: ellipsis; }
        .hash { grid-column: 1 / -1; }
      </style>
      <section aria-label="Genética del avatar">
        <h2>Seed DNA Inspector</h2>
        <dl></dl>
      </section>
    `;
    this.#grid = root.querySelector('dl')!;
  }

  update(dna: AvatarDNA): void {
    const entries: Array<[string, string, string?]> = [
      ['Hash', `0x${dna.hashHex}`, 'hash'],
      ['Cabeza', `#${dna.headIndex}`],
      ['Pelo', `#${dna.hairIndex}`],
      ['Ojos', `#${dna.eyesIndex}`],
      ['Expresión', `#${dna.expressionIndex}`],
      ['Paleta', dna.paletteName],
    ];

    this.#grid.replaceChildren(...entries.map(([label, value, className]) => {
      const cell = document.createElement('div');
      if (className) cell.className = className;
      const term = document.createElement('dt');
      term.textContent = label;
      const detail = document.createElement('dd');
      detail.textContent = value;
      cell.append(term, detail);
      return cell;
    }));
  }
}

if (!customElements.get('dna-inspector')) {
  customElements.define('dna-inspector', DnaInspector);
}

export { DnaInspector };
