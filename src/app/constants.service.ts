import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConstantsService {
  PRECISION = 1e18;
  ZKNETWORK = "rinkeby";
  MAP = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  IPFS_GATEWAY = "https://ipfs.io/ipfs/";
  ZK_EXPLORER = "https://rinkeby.zkscan.io/explorer/transactions/";
  ETH_EXPLORER = "https://rinkeby.etherscan.io/tx/";
  ZK_WALLET = "https://wallet.zksync.io/";
}