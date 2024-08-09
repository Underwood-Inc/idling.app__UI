export default async function fakeDelay(time = 7000) {
  return await new Promise((resolve) => setTimeout(resolve, time));
}
