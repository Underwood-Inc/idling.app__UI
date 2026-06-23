/**
 * Web Install API (navigator.install) — Chrome / Edge origin trial.
 * @see https://microsoftedge.github.io/Demos/pwa-web-install-api/
 * @see https://github.com/MicrosoftEdge/MSEdgeExplainers/blob/main/WebInstall/explainer-background-doc.md
 */
export interface NavigatorWithInstall extends Navigator {
  install?: (installUrl: string, manifestId?: string) => Promise<string>;
}
