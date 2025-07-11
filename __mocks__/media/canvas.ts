/**
 * Media API Mocks
 * 
 * Mocks for media-related APIs including Canvas, Image, Audio, Video, and SVG
 * that are commonly used in React components but not fully implemented in jsdom.
 */

/**
 * Mock Canvas API
 */
export const mockCanvasAPI = () => {
  /**
   * Mock HTMLCanvasElement.prototype.getContext
   * 
   * This is useful for testing canvas-based functionality
   */
  HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn().mockReturnValue({
      data: [0, 0, 0, 0],
      width: 1,
      height: 1
    }),
    putImageData: jest.fn(),
    createImageData: jest.fn().mockReturnValue({
      data: [0, 0, 0, 0],
      width: 1,
      height: 1
    }),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    fillText: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    stroke: jest.fn(),
    translate: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    measureText: jest.fn().mockReturnValue({ width: 0 }),
    transform: jest.fn(),
    rect: jest.fn(),
    clip: jest.fn()
  });
};

/**
 * Mock Image API
 */
export const mockImageAPI = () => {
  /**
   * Mock Image loading
   * 
   * This is useful for testing image loading
   */
  global.Image = jest.fn().mockImplementation(() => ({
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    src: '',
    alt: '',
    width: 0,
    height: 0,
    complete: true,
    naturalWidth: 0,
    naturalHeight: 0,
    onload: null,
    onerror: null
  }));
};

/**
 * Mock Audio and Video APIs
 */
export const mockMediaElementAPIs = () => {
  /**
   * Mock HTMLMediaElement methods
   * 
   * These are useful for testing media functionality
   */
  global.HTMLMediaElement.prototype.play = jest.fn().mockResolvedValue(undefined);
  global.HTMLMediaElement.prototype.pause = jest.fn();
  global.HTMLMediaElement.prototype.load = jest.fn();
  global.HTMLMediaElement.prototype.canPlayType = jest.fn().mockReturnValue('');
};

/**
 * Mock SVG API
 */
export const mockSVGAPI = () => {
  /**
   * Mock SVGElement.prototype.getBBox
   * 
   * This is useful for testing SVG-based functionality
   */
  SVGElement.prototype.getBBox = jest.fn().mockReturnValue({
    x: 0,
    y: 0,
    width: 0,
    height: 0
  });
};

/**
 * Mock URL object methods
 */
export const mockURLAPIs = () => {
  /**
   * Mock URL.createObjectURL and revokeObjectURL
   * 
   * These are useful for testing file handling
   */
  global.URL.createObjectURL = jest.fn().mockReturnValue('mock-url');
  global.URL.revokeObjectURL = jest.fn();
};

/**
 * Apply all media mocks
 */
export const mockMediaAPIs = () => {
  mockCanvasAPI();
  mockImageAPI();
  mockMediaElementAPIs();
  mockSVGAPI();
  mockURLAPIs();
}; 