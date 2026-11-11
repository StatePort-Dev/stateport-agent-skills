// Runtime compatibility is independent from the Node 24 build toolchain.
export const NODE_RANGE = '>=22.13.0 <23 || >=24.0.0 <25';
export const NATIVE_API = 8;
export function supportedNode(version) {
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(version);
  if (!match) return false;
  const major = Number(match[1]), minor = Number(match[2]);
  return major === 24 || (major === 22 && minor >= 13);
}
