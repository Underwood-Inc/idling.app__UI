const publicRuntimeConfig = {
  version: '1.2.3'
};

const getConfig = jest.fn(() => ({
  publicRuntimeConfig
}));

export default getConfig;
