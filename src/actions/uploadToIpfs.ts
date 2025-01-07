// src/actions/uploadToIpfs.ts

import fs from 'fs';
import { createFleekSdk } from '@fleek-platform/sdk';
import dotenv from 'dotenv';
import { TokenMetadata } from './metadata.js';

dotenv.config();

interface UploadMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  showName: boolean;
  createdOn: string;
  twitter?: string;
  telegram?: string;
  website?: string;
}

const apiKey = process.env.FLEEK_API_KEY || '';
const imageName = "./upload/bolt.jpg";
const metadataName = "./upload/metadata.json";

const fleekSdk = createFleekSdk({ apiKey });

export async function uploadFileToIPFS(filename: string, content: Buffer) {
  const result = await fleekSdk.ipfs().add({
    data: content
  });
  return result;
}

export const getUploadedMetadataURI = async (metadata: UploadMetadata): Promise<string> => {
  const fileContent = fs.readFileSync(imageName);

  try {
    const imageUploadResult = await uploadFileToIPFS(imageName, fileContent);
    console.log('Image uploaded to IPFS:', imageUploadResult);
    console.log('IPFS URL:', `https://cf-ipfs.com/ipfs/${imageUploadResult.hash}`);

    const data: UploadMetadata = {
      name: metadata.name,
      symbol: metadata.symbol,
      description: metadata.description,
      image: `https://cf-ipfs.com/ipfs/${imageUploadResult.hash}`,
      showName: metadata.showName,
      createdOn: metadata.createdOn || new Date().toISOString(),
      twitter: metadata.twitter,
      telegram: metadata.telegram,
      website: metadata.website
    };

    const metadataString = JSON.stringify(data);
    const bufferContent = Buffer.from(metadataString, 'utf-8');
    fs.writeFileSync(metadataName, bufferContent);
    const metadataContent = fs.readFileSync(metadataName);

    const metadataUploadResult = await uploadFileToIPFS(metadataName, metadataContent);
    console.log('File uploaded to IPFS:', metadataUploadResult);
    console.log('IPFS URL:', `https://cf-ipfs.com/ipfs/${metadataUploadResult.hash}`);
    
    return `https://cf-ipfs.com/ipfs/${metadataUploadResult.hash}`;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    return "";
  }
};

// Example usage
export async function uploadTokenMetadata(metadata: TokenMetadata): Promise<string> {
  const uploadMetadata: UploadMetadata = {
    name: metadata.name,
    symbol: metadata.symbol,
    description: metadata.description,
    image: '', // Will be set during upload
    showName: true,
    createdOn: new Date().toISOString(),
    twitter: metadata.links?.twitter,
    telegram: metadata.links?.telegram,
    website: metadata.links?.website
  };

  return await getUploadedMetadataURI(uploadMetadata);
}
