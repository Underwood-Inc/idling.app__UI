/**
 * Observability Module
 * Exports all observability and analytics integrations
 * 
 * @author System Wizard 🧙‍♂️
 */

// Microsoft Clarity - Heatmaps, Session Recordings, User Behavior
export { 
  MicrosoftClarity,
  claritySetTag,
  clarityIdentify,
  clarityConsent,
  clarityUpgrade,
  clarityEvent,
  type MicrosoftClarityProps 
} from './MicrosoftClarity';

// React hook for automatic user identification in Clarity
export { useClarityIdentify, type UseClarityIdentifyOptions } from './useClarityIdentify';

// Client component for automatic user identification (use inside SessionProvider)
export { ClarityUserIdentifier } from './ClarityUserIdentifier';

// SigNoz OpenTelemetry - APM, Traces, Logs, Metrics
// Note: SigNoz instrumentation is configured in instrumentation.ts (server-side)
// This export is for any client-side utilities we might add later

