/**
 * Asset State Machine
 * 
 * Manages valid state transitions and enforces business rules
 * State machine: Ordered → Received → In Staging → In Service → In Repair → In Loaner → Lost → Retired/Disposed
 */

import { AssetState, StateTransition, ITAMAsset, STATE_TRANSITIONS } from '../types/itam';

/**
 * Check if a state transition is valid
 */
export function isValidTransition(
  from: AssetState,
  to: AssetState,
  asset?: ITAMAsset
): { valid: boolean; reason?: string } {
  // Same state is always valid (no-op)
  if (from === to) {
    return { valid: true };
  }

  // Find transition rule
  const transition = STATE_TRANSITIONS.find(
    (t) => t.from === from && t.to === to
  );

  if (!transition) {
    return {
      valid: false,
      reason: `Invalid transition from ${from} to ${to}`,
    };
  }

  // Check conditions if asset is provided
  if (asset && transition.conditions) {
    const conditions = transition.conditions;

    // Owner required check
    if (conditions.ownerRequired && !asset.owner) {
      return {
        valid: false,
        reason: 'Owner is required for this transition',
      };
    }

    // Data wipe cert required for disposal
    if (conditions.dataWipeCertRequired && to === 'Disposed') {
      const hasWipeCert = asset.docs?.some(
        (doc) => doc.type === 'WipeCert'
      );
      if (!hasWipeCert) {
        return {
          valid: false,
          reason: 'Data wipe certificate is required for disposal',
        };
      }
    }

    // Warranty check required
    if (conditions.warrantyCheckRequired && !asset.warranty) {
      return {
        valid: false,
        reason: 'Warranty information is required for this transition',
      };
    }
  }

  return { valid: true };
}

/**
 * Get all valid next states from current state
 */
export function getValidNextStates(
  currentState: AssetState,
  asset?: ITAMAsset
): AssetState[] {
  const validStates: AssetState[] = [];

  for (const transition of STATE_TRANSITIONS) {
    if (transition.from === currentState) {
      const validation = isValidTransition(
        currentState,
        transition.to,
        asset
      );
      if (validation.valid) {
        validStates.push(transition.to);
      }
    }
  }

  return validStates;
}

/**
 * Get state transition history (for display)
 */
export function getStateHistory(asset: ITAMAsset): Array<{
  state: AssetState;
  timestamp: string;
  reason?: string;
}> {
  // This would typically come from the asset's history/audit log
  // For now, return current state
  return [
    {
      state: asset.state,
      timestamp: asset.updatedAt || asset.createdAt || new Date().toISOString(),
    },
  ];
}

/**
 * State display metadata
 */
export const STATE_METADATA: Record<
  AssetState,
  { label: string; color: string; icon?: string }
> = {
  Ordered: { label: 'Ordered', color: 'blue' },
  Received: { label: 'Received', color: 'purple' },
  'In Staging': { label: 'In Staging', color: 'yellow' },
  'In Service': { label: 'In Service', color: 'green' },
  'In Repair': { label: 'In Repair', color: 'orange' },
  'In Loaner': { label: 'In Loaner', color: 'cyan' },
  Lost: { label: 'Lost', color: 'red' },
  Retired: { label: 'Retired', color: 'gray' },
  Disposed: { label: 'Disposed', color: 'black' },
};

/**
 * Get state display info
 */
export function getStateDisplay(state: AssetState) {
  return STATE_METADATA[state] || { label: state, color: 'gray' };
}

/**
 * Check if asset can be disposed
 */
export function canDispose(asset: ITAMAsset): { can: boolean; reason?: string } {
  // Can't dispose if still assigned
  if (asset.owner && asset.state !== 'Retired') {
    return {
      can: false,
      reason: 'Asset must be unassigned before disposal',
    };
  }

  // Must have wipe cert
  const hasWipeCert = asset.docs?.some((doc) => doc.type === 'WipeCert');
  if (!hasWipeCert) {
    return {
      can: false,
      reason: 'Data wipe certificate is required',
    };
  }

  return { can: true };
}

/**
 * Check if asset can be assigned
 */
export function canAssign(asset: ITAMAsset): { can: boolean; reason?: string } {
  // Only assets in service can be assigned (or loaners)
  if (asset.state !== 'In Service' && asset.state !== 'In Loaner') {
    return {
      can: false,
      reason: `Asset must be in service to assign. Current state: ${asset.state}`,
    };
  }

  return { can: true };
}

/**
 * Check if asset can be checked out as loaner
 */
export function canCheckoutAsLoaner(asset: ITAMAsset): { can: boolean; reason?: string } {
  // Asset must be available (In Service and not assigned)
  if (asset.state !== 'In Service') {
    return {
      can: false,
      reason: 'Asset must be in service to checkout as loaner',
    };
  }

  if (asset.owner) {
    return {
      can: false,
      reason: 'Asset must be unassigned to checkout as loaner',
    };
  }

  return { can: true };
}

