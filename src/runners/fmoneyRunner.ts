import * as dotenv from 'dotenv';
import config from '../configs/fmoney.json';
import { GetRpcUrlForNetwork } from '../utils/Utils';
import { CompoundParser } from '../parsers/compound/CompoundParser';
dotenv.config();

async function fmoneyRunner() {
  const rpcUrl = GetRpcUrlForNetwork(config.network);
  if (!rpcUrl) {
    throw new Error(`Could not find rpc url in env variable for network ${config.network}`);
  }

  const runnerName = 'fmoneyParser-Runner';
  const parser = new CompoundParser(config, runnerName, rpcUrl, 'fantom_fmoney.json', 24, 1);
  await parser.main();
}

fmoneyRunner();
