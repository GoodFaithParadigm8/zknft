import { Component, OnInit } from '@angular/core';
import { WalletService } from '../wallet.service';
import { ConstantsService } from '../constants.service';
import { BigNumber } from "bignumber.js";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  noFunds: boolean
  notActivated: boolean;
  depositAmount: any;
  l1EthBalance: any;
  l2EthBalance: BigNumber;
  blockiesOptions: any;
  networkName: any;

  constructor(public wallet:WalletService, public constants: ConstantsService) {
    this.l1EthBalance = new BigNumber(0);
    this.l2EthBalance = new BigNumber(0);
    this.noFunds = false;
    this.notActivated = false;
   }

  ngOnInit(): void {
    this.loadData();
  }

  async loadData() {
    this.networkName = await this.wallet.getNetwork();
  }

  async connectWallet() {
    this.networkName = await this.wallet.getNetwork();
    this.wallet.connect(async () => {
      this.l1EthBalance = new BigNumber(await this.wallet.web3.eth.getBalance(this.wallet.userAddress)).div(this.constants.PRECISION);
      await this.zkConnect();
    }, () => {}, false);
    
    this.blockiesOptions = { // All options are optional
      seed: this.wallet.userAddress, // seed used to generate icon data, default: random
      color: '#dfe', // to manually specify the icon color, default: random
      bgcolor: '#aaa', // choose a different background color, default: random
      size: 8, // width/height of the icon in blocks, default: 8
      scale: 2, // width/height of each block in pixels, default: 4
      spotcolor: '#fff' // each pixel has a 13% chance of being of a third color,
    }
  }

  async zkConnect() {
    await this.wallet.zkConnect();
    this.l2EthBalance = new BigNumber((await this.wallet.syncWallet.getBalance("ETH"))/this.constants.PRECISION);
    if ((this.l2EthBalance).eq(new BigNumber(0))) {
      this.noFunds = true;
    }
    else if (!(await this.wallet.syncWallet.isSigningKeySet())) {
      console.log(await this.wallet.syncWallet.isSigningKeySet());
      if ((await this.wallet.syncWallet.getAccountId()) !== undefined) {  
        this.notActivated = true;
      }
    }
  }

  dismissNoFunds() {
    this.noFunds = false;
  }

  dismissNotActivated() {
    this.notActivated = false;
  }

  async depositETH() {
    const deposit = await this.wallet.syncWallet.depositToSyncFromEthereum({
      depositTo: this.wallet.syncWallet.address(),
      token: "ETH",
      amount: new BigNumber(this.depositAmount).times(this.constants.PRECISION).integerValue().toFixed(),
      ethTxOptions: {
        gasLimit: 200000
      }
    });
    this.wallet.showToast(`
    Your transaction was submitted! Track it <a href="${this.constants.ETH_EXPLORER + deposit.ethTx.hash}" target='_blank'>here</a>.
    `);
    this.dismissNoFunds();
    const depositReceipt = await deposit.awaitVerifyReceipt();
    this.wallet.showToast(`
    Your transaction was verified!
    `);
    await this.zkConnect();
  }

  async setSigningKey() {
    const changePubkey = await this.wallet.syncWallet.setSigningKey({
      feeToken: "ETH",
      ethAuthType: "ECDSA",
    });
    this.dismissNotActivated();
    this.wallet.showToast(`
    Your transaction was submitted! Track it <a href="${this.wallet.zkExplorer() + changePubkey.txHash.substring(8,)}" target='_blank'>here</a>.
    `);
  }
}
