export const adventurer = {
  create: jest.fn().mockReturnValue({
    toDataUriSync: jest.fn().mockReturnValue('data:image/svg+xml;base64,mock')
  })
};
