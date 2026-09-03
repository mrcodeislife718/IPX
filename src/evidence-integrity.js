import { createHash } from 'node:crypto';

export async function hashBlob(blob,{maxBytes=104857600}={}){
  if(!blob || typeof blob.stream!=='function')throw new Error('Storage object is not streamable');
  const hash=createHash('sha256'); let bytes=0;
  const reader=blob.stream().getReader();
  while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>maxBytes)throw Object.assign(new Error('Evidence exceeds authorized size'),{statusCode:413});hash.update(value);}
  return {content_hash:hash.digest('hex'),byte_size:bytes};
}

export async function verifyStoredEvidence({storage,bucket='ipx-evidence',path,expectedBytes,claimedHash}){
  const {data,error}=await storage.from(bucket).download(path); if(error)throw error;
  const verified=await hashBlob(data,{maxBytes:Number(expectedBytes)});
  if(verified.byte_size!==Number(expectedBytes))throw Object.assign(new Error('Stored evidence size mismatch'),{statusCode:409});
  if(claimedHash && verified.content_hash!==String(claimedHash).toLowerCase())throw Object.assign(new Error('Stored evidence hash mismatch'),{statusCode:409});
  return verified;
}

export function encryptionAssertion({providerAtRest=false,clientEnvelope=false,keyReference=null}={}){
  return { encrypted:Boolean(providerAtRest||clientEnvelope), encryption_mode:clientEnvelope?'client-envelope':providerAtRest?'provider-at-rest':'none', key_reference:clientEnvelope?keyReference:null };
}
