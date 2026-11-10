import {createHash} from 'node:crypto';
// Data-format identity is independent of engine source and release numbering.
// These legacy source fingerprints were audited against the same persisted data.
export const storageFormat = 'stateport-local-data/1';
export const storageIdentity = createHash('sha256').update(storageFormat).digest('hex');
export const reviewedStorageSources = Object.freeze([
 '5f0e61063a05a1f4c700c030ac61d6477c891e7d4762933600c32b6368c6e889',
 '1a3e8f25656dd04fed3bdc8dc8d0505dfefe2dd1fa7e8a8f134962a24342dc8b',
]);
const family=new Set([...reviewedStorageSources,storageIdentity]);
export function compatibleStorage(before,after){
 if(!before||!after)return false;
 if(before.storageRead===after.storageRead&&before.storageWrite===after.storageWrite)return true;
 return before.storageRead===before.storageWrite&&after.storageRead===after.storageWrite&&family.has(before.storageRead)&&family.has(after.storageRead);
}
