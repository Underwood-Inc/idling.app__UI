export type RadioPwaInstallMethod = 'web-install-api' | 'before-install-prompt' | 'ios-manual';

export type RadioPwaInstallFailureReason =
  | 'unsupported'
  | 'dismissed'
  | 'aborted'
  | 'manifest-error'
  | 'no-method';

export interface RadioPwaInstallSuccess {
  ok: true;
  method: RadioPwaInstallMethod;
}

export interface RadioPwaInstallFailure {
  ok: false;
  reason: RadioPwaInstallFailureReason;
  manualHint?: 'ios-add-to-home-screen';
}

export type RadioPwaInstallResult = RadioPwaInstallSuccess | RadioPwaInstallFailure;

export interface RadioPwaInstallCapability {
  canOfferInstall: boolean;
  preferredMethod: RadioPwaInstallMethod | null;
}
