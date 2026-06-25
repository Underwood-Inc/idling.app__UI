import {
  createWebglAudioReactiveState,
  tickWebglAudioReactive,
} from './webglAudioReactiveState';

describe('webglAudioReactiveState', () => {
  test('when bass energy spikes, beat rises then decays', () => {
    const quiet = new Uint8Array([10, 12, 8, 6, 4, 2]);
    const loud = new Uint8Array([220, 210, 180, 120, 80, 40]);

    const quietTick = tickWebglAudioReactive({
      frequencyData: quiet,
      state: createWebglAudioReactiveState(),
    });
    const loudTick = tickWebglAudioReactive({
      frequencyData: loud,
      state: quietTick.state,
    });

    expect(loudTick.uniforms.bass).toBeGreaterThan(quietTick.uniforms.bass);
    expect(loudTick.uniforms.beat).toBeGreaterThan(0);
  });
});
