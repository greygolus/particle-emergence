/**
 * Tooltip Manager
 * Handles showing, hiding, and positioning tooltips throughout the game
 */

import { PARTICLE_TOOLTIPS, MACHINE_INFO } from '../config/tooltipContent';
import { formatNumber } from '../utils/format';
import type { GameState } from '../types';

let tooltipElement: HTMLElement | null = null;
let gameStateRef: (() => GameState) | null = null;

const VIEWPORT_PADDING = 10;

/**
 * Initialize the tooltip system
 */
export function initTooltipSystem(getState: () => GameState): void {
  gameStateRef = getState;

  // Create tooltip element if it doesn't exist
  tooltipElement = document.getElementById('tooltip');
  if (!tooltipElement) {
    tooltipElement = document.createElement('div');
    tooltipElement.id = 'tooltip';
    tooltipElement.classList.add('hidden');
    document.body.appendChild(tooltipElement);
  }

  // Use capture phase for reliable event handling
  document.addEventListener('mouseover', handleMouseOver, true);
  document.addEventListener('mouseout', handleMouseOut, true);
  document.addEventListener('mousemove', handleMouseMove);
}

/**
 * Handle mouseover events
 */
function handleMouseOver(e: MouseEvent): void {
  const target = e.target as HTMLElement;

  // Check for particle tooltip
  const particleEl = target.closest('[data-tooltip-particle]') as HTMLElement;
  if (particleEl) {
    const particleId = particleEl.getAttribute('data-tooltip-particle');
    if (particleId) {
      showParticleTooltip(particleId, e.clientX, e.clientY);
    }
    return;
  }

  // Check for info button tooltip
  const infoBtn = target.closest('[data-tooltip-info]') as HTMLElement;
  if (infoBtn) {
    const machineId = infoBtn.getAttribute('data-tooltip-info');
    if (machineId) {
      showMachineInfoTooltip(machineId, e.clientX, e.clientY);
    }
    return;
  }
}

/**
 * Handle mouseout events
 */
function handleMouseOut(e: MouseEvent): void {
  const target = e.target as HTMLElement;
  const relatedTarget = e.relatedTarget as HTMLElement;

  // Check if leaving a tooltip-enabled element
  const tooltipEl = target.closest('[data-tooltip-particle], [data-tooltip-info]');
  if (tooltipEl) {
    // Don't hide if moving to a child of the same tooltip element
    if (relatedTarget && tooltipEl.contains(relatedTarget)) {
      return;
    }
    hideTooltip();
  }
}

/**
 * Handle mouse movement for tooltip positioning
 */
function handleMouseMove(e: MouseEvent): void {
  if (!tooltipElement || tooltipElement.classList.contains('hidden')) return;
  positionTooltip(e.clientX, e.clientY);
}

/**
 * Show tooltip for a particle
 */
function showParticleTooltip(particleId: string, mouseX: number, mouseY: number): void {
  if (!tooltipElement || !gameStateRef) return;

  const data = PARTICLE_TOOLTIPS[particleId];
  if (!data) return;

  const state = gameStateRef();
  const count = getParticleCount(state, particleId);

  const tierClass = data.tier ? `tier${data.tier}` : '';
  const tierLabel = data.tier ? `T${data.tier} ${data.category}` : data.category;
  const categoryClass = getCategoryClass(data.category);

  tooltipElement.innerHTML = `
    <div class="tooltip-header">
      <span class="tooltip-name ${tierClass} ${categoryClass}">${data.fullName}</span>
      <span class="tooltip-tier ${tierClass}">${tierLabel}</span>
    </div>
    <div class="tooltip-count">Count: <strong>${formatNumber(count)}</strong></div>
    <div class="tooltip-desc">${data.description}</div>
    <div class="tooltip-usage"><strong>Used for:</strong> ${data.usedFor}</div>
  `;

  showTooltip(mouseX, mouseY);
}

/**
 * Show tooltip for machine info button
 */
function showMachineInfoTooltip(machineId: string, mouseX: number, mouseY: number): void {
  if (!tooltipElement) return;

  const data = MACHINE_INFO[machineId];
  if (!data) return;

  const mechanicsHtml = data.mechanics.map(m => `<li>${m}</li>`).join('');
  const tipsHtml = data.tips ? data.tips.map(t => `<li>${t}</li>`).join('') : '';

  tooltipElement.innerHTML = `
    <div class="tooltip-header">
      <span class="tooltip-title">${data.title}</span>
    </div>
    <div class="tooltip-desc">${data.description}</div>
    <div class="tooltip-section">
      <strong>How it works:</strong>
      <ul>${mechanicsHtml}</ul>
    </div>
    ${tipsHtml ? `<div class="tooltip-section"><strong>Tips:</strong><ul>${tipsHtml}</ul></div>` : ''}
  `;

  showTooltip(mouseX, mouseY);
}

/**
 * Show the tooltip element
 */
function showTooltip(mouseX: number, mouseY: number): void {
  if (!tooltipElement) return;
  tooltipElement.classList.remove('hidden');
  // Position after showing so we can measure
  requestAnimationFrame(() => positionTooltip(mouseX, mouseY));
}

/**
 * Hide the tooltip
 */
function hideTooltip(): void {
  if (!tooltipElement) return;
  tooltipElement.classList.add('hidden');
}

/**
 * Position tooltip near mouse, avoiding viewport overflow
 */
function positionTooltip(mouseX: number, mouseY: number): void {
  if (!tooltipElement) return;

  const rect = tooltipElement.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Default offset from cursor
  let left = mouseX + 15;
  let top = mouseY + 10;

  // Check right edge
  if (left + rect.width > viewportWidth - VIEWPORT_PADDING) {
    left = mouseX - rect.width - 15;
  }

  // Check bottom edge
  if (top + rect.height > viewportHeight - VIEWPORT_PADDING) {
    top = mouseY - rect.height - 10;
  }

  // Ensure not negative
  left = Math.max(VIEWPORT_PADDING, left);
  top = Math.max(VIEWPORT_PADDING, top);

  tooltipElement.style.left = `${left}px`;
  tooltipElement.style.top = `${top}px`;
}

/**
 * Get particle count from state by particle ID
 */
function getParticleCount(state: GameState, particleId: string): number {
  // Map display IDs to state keys
  const matterMap: Record<string, keyof typeof state.matter> = {
    'u': 'u', 'd': 'd', 'e-': 'e-', 've': 've',
    's': 's', 'c': 'c', 'μ-': 'mu-', 'vμ': 'vmu',
    'b': 'b', 't': 't', 'τ-': 'tau-', 'vτ': 'vtau',
    'mu-': 'mu-', 'vmu': 'vmu', 'tau-': 'tau-', 'vtau': 'vtau',
  };

  const antimatterMap: Record<string, keyof typeof state.antimatter> = {
    'ū': 'u_bar', 'd̄': 'd_bar', 'e+': 'e+', 'v̄e': 've_bar',
    's̄': 's_bar', 'c̄': 'c_bar', 'μ+': 'mu+', 'v̄μ': 'vmu_bar',
    'b̄': 'b_bar', 't̄': 't_bar', 'τ+': 'tau+', 'v̄τ': 'vtau_bar',
    'u_bar': 'u_bar', 'd_bar': 'd_bar', 've_bar': 've_bar',
    's_bar': 's_bar', 'c_bar': 'c_bar', 'mu+': 'mu+', 'vmu_bar': 'vmu_bar',
    'b_bar': 'b_bar', 't_bar': 't_bar', 'tau+': 'tau+', 'vtau_bar': 'vtau_bar',
  };

  // Check matter
  if (particleId in matterMap) {
    const key = matterMap[particleId];
    return state.matter[key] ?? 0;
  }

  // Check antimatter
  if (particleId in antimatterMap) {
    const key = antimatterMap[particleId];
    return state.antimatter[key] ?? 0;
  }

  // Check catalysts
  if (particleId === 'photon') return state.catalysts.photon;
  if (particleId === 'gluon') return state.catalysts.gluon;

  // Check composites
  if (particleId === 'proton') return state.composites.proton;
  if (particleId === 'neutron') return state.composites.neutron;

  // Check bosons
  if (particleId === 'W+') return state.bosons['W+'];
  if (particleId === 'W-') return state.bosons['W-'];
  if (particleId === 'Z0') return state.bosons['Z0'];
  if (particleId === 'higgs') return state.bosons.higgs;

  return 0;
}

/**
 * Get CSS class for particle category
 */
function getCategoryClass(category: string): string {
  switch (category) {
    case 'antiquark':
    case 'antilepton':
      return 'antimatter';
    case 'catalyst':
      return 'catalyst';
    case 'composite':
      return 'composite';
    case 'boson':
      return 'boson';
    default:
      return '';
  }
}

export { hideTooltip };
