export interface NetrunnerGridRendererTuning {
  scrollRateScale: number;
  buildingHeightScale: number;
  buildingWidthScale: number;
  gridGlowScale: number;
  gridLineScale: number;
  avenueAlphaScale: number;
  fieldOfViewRadians: number;
  cameraY: number;
  cameraZ: number;
  bandResponseLerp: number;
}

export const NETRUNNER_GRID_TUNING_STANDARD: NetrunnerGridRendererTuning = {
  scrollRateScale: 1,
  buildingHeightScale: 1,
  buildingWidthScale: 1,
  gridGlowScale: 1,
  gridLineScale: 1,
  avenueAlphaScale: 1,
  fieldOfViewRadians: Math.PI / 2.35,
  cameraY: -0.85,
  cameraZ: -3.2,
  bandResponseLerp: 0.09,
};
