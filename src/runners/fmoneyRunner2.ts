import * as dotenv from 'dotenv';
import config from '../configs/fmoney.json';
import { GetRpcUrlForNetwork } from '../utils/Utils';
import { CompoundParser } from '../parsers/compound/CompoundParser';
import axios, { AxiosError } from 'axios';

dotenv.config();

async function getMarketData(url: string, retries: number = 10, backoff: number = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Attempt ${attempt}: Fetching market data from ${url}`);
      const response = await axios.get(url, { timeout: 5000 }); // Adding a timeout of 5 seconds
      console.log(`Attempt ${attempt}: Success`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`Retry ${attempt} failed: ${error.message}`);
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response headers:', error.response.headers);
          console.error('Response data:', error.response.data);
        } else {
          console.error('Error details:', error.toJSON());
        }
      } else {
        console.error(`Retry ${attempt} failed:`, error);
      }
      if (attempt < retries) {
        console.log(`Waiting ${backoff * attempt / 1000} second(s) before retrying...`);
        await new Promise(resolve => setTimeout(resolve, backoff * attempt));
      } else {
        throw new Error(`Failed after ${retries} retries: ${(error as Error).message}`);
      }
    }
  }
}

async function fmoneyRunner() {
  const rpcUrl = GetRpcUrlForNetwork(config.network);
  if (!rpcUrl) {
    throw new Error(`Could not find rpc url in env variable for network ${config.network}`);
  }

  const runnerName = 'fmoneyParser-Runner';
  const url = 'https://web3.api.la-tribu.xyz/api/token/infos?network=ftm&tokenAddress=0x2885d6eca9f12269a378c76ddeccf90d993cf6d5';

  try {
    const marketData = await getMarketData(url);
    console.log('Market data:', marketData);

    const parser = new CompoundParser(config, runnerName, rpcUrl, 'fantom_fmoney.json', 24, 1);
    await parser.main();
  } catch (error) {
    console.error('Error initializing parser:', error);
  }
}

fmoneyRunner();
