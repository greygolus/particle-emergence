/**
 * UI Updater - Targeted DOM update utilities
 *
 * These helpers allow updating specific parts of the DOM without
 * replacing the entire innerHTML, which preserves:
 * - Event listeners (though we use delegation)
 * - Hover states
 * - Focus states
 * - Click timing
 */

/**
 * Update text content of an element by data-bind attribute
 */
export function setText(container: HTMLElement, bindKey: string, text: string): void {
  const el = container.querySelector(`[data-bind="${bindKey}"]`);
  if (el && el.textContent !== text) {
    el.textContent = text;
  }
}

/**
 * Update innerHTML of an element by data-bind attribute
 * Use sparingly - prefer setText when possible
 */
export function setHtml(container: HTMLElement, bindKey: string, html: string): void {
  const el = container.querySelector(`[data-bind="${bindKey}"]`);
  if (el && el.innerHTML !== html) {
    el.innerHTML = html;
  }
}

/**
 * Set or remove a class on an element
 */
export function setClass(container: HTMLElement, bindKey: string, className: string, enabled: boolean): void {
  const el = container.querySelector(`[data-bind="${bindKey}"]`);
  if (el) {
    if (enabled && !el.classList.contains(className)) {
      el.classList.add(className);
    } else if (!enabled && el.classList.contains(className)) {
      el.classList.remove(className);
    }
  }
}

/**
 * Toggle disabled state on a button
 */
export function setDisabled(container: HTMLElement, bindKey: string, disabled: boolean): void {
  setClass(container, bindKey, 'disabled', disabled);
}

/**
 * Toggle active state on a button
 */
export function setActive(container: HTMLElement, bindKey: string, active: boolean): void {
  setClass(container, bindKey, 'active', active);
}

/**
 * Set an attribute value
 */
export function setAttr(container: HTMLElement, bindKey: string, attr: string, value: string): void {
  const el = container.querySelector(`[data-bind="${bindKey}"]`);
  if (el && el.getAttribute(attr) !== value) {
    el.setAttribute(attr, value);
  }
}

/**
 * Set the value of an input element
 */
export function setInputValue(container: HTMLElement, bindKey: string, value: string | number): void {
  const el = container.querySelector(`[data-bind="${bindKey}"]`) as HTMLInputElement;
  if (el && el.value !== String(value)) {
    el.value = String(value);
  }
}

/**
 * Set checked state of a checkbox
 */
export function setChecked(container: HTMLElement, bindKey: string, checked: boolean): void {
  const el = container.querySelector(`[data-bind="${bindKey}"]`) as HTMLInputElement;
  if (el && el.checked !== checked) {
    el.checked = checked;
  }
}

/**
 * Show or hide an element
 */
export function setVisible(container: HTMLElement, bindKey: string, visible: boolean): void {
  const el = container.querySelector(`[data-bind="${bindKey}"]`) as HTMLElement;
  if (el) {
    const isHidden = el.style.display === 'none';
    if (visible && isHidden) {
      el.style.display = '';
    } else if (!visible && !isHidden) {
      el.style.display = 'none';
    }
  }
}

/**
 * Update progress bar width
 */
export function setProgress(container: HTMLElement, bindKey: string, progress: number): void {
  const el = container.querySelector(`[data-bind="${bindKey}"]`) as HTMLElement;
  if (el) {
    const width = `${Math.max(0, Math.min(100, progress * 100))}%`;
    if (el.style.width !== width) {
      el.style.width = width;
    }
  }
}

/**
 * Batch update multiple text values
 */
export function batchSetText(container: HTMLElement, updates: Record<string, string>): void {
  for (const [key, value] of Object.entries(updates)) {
    setText(container, key, value);
  }
}

/**
 * Batch update multiple disabled states
 */
export function batchSetDisabled(container: HTMLElement, updates: Record<string, boolean>): void {
  for (const [key, disabled] of Object.entries(updates)) {
    setDisabled(container, key, disabled);
  }
}
