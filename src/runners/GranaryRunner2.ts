import * as dotenv from 'dotenv';
import multiNetworkConfig from '../configs/GranaryRunnerConfig.json';
import { GetRpcUrlForNetwork } from '../utils/Utils';
import { GranaryParser } from '../parsers/aave/GranaryParser';
import axios, { AxiosError } from 'axios';

dotenv.config();

const fileNameMap = {
  FANTOM: 'FTM_granary.json',
  OPTIMISM: 'optimism_granary.json'
};

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

async function GranaryRunner() {
  const networkToUse = process.argv[2];
  if (!networkToUse) {
    throw new Error(
      `Cannot start granary runner without network as first argument. Available networks: ${Object.keys(
        multiNetworkConfig
      ).join(', ')}`
    );
  }
  const config = multiNetworkConfig[networkToUse as keyof typeof multiNetworkConfig];
  const rpcUrl = GetRpcUrlForNetwork(config.network);
  if (!rpcUrl) {
    throw new Error(`Could not find rpc url in env variable for network ${config.network}`);
  }

  const runnerName = `GranaryParser-${config.network}-Runner`;
  const jsonFileName = fileNameMap[networkToUse.toUpperCase() as keyof typeof fileNameMap];
  const parser = new GranaryParser(config, runnerName, rpcUrl, jsonFileName, 24, 1);

  try {
    const url = `https://web3.api.la-tribu.xyz/api/token/infos?network=${config.network}&tokenAddress=${config.tokenAddress}`;
    const marketData = await getMarketData(url);
    console.log(`${config.network} market data:`, marketData);

    await parser.main();
  } catch (error) {
    console.error('Error initializing parser:', error);
  }
}

GranaryRunner();
