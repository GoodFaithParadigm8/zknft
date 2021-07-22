import { Component, OnInit } from '@angular/core';
import { WalletService } from '../wallet.service';
import { ConstantsService } from '../constants.service';
import { BigNumber } from "bignumber.js";

@Component({
  selector: 'app-portal',
  templateUrl: './portal.component.html',
  styleUrls: ['./portal.component.css']
})
export class PortalComponent implements OnInit {

  depositAmount: any;
  withdrawAmount: any;
  l1EthBalance: BigNumber;
  l2EthBalance: BigNumber;
  withdrawFee: BigNumber;
  maxL2WithdrawAmount: BigNumber;

  constructor(public wallet:WalletService, public constants: ConstantsService) {
    this.l1EthBalance = new BigNumber(0);
    this.l2EthBalance = new BigNumber(0);
    this.withdrawFee = new BigNumber(0);
    this.maxL2WithdrawAmount = new BigNumber(0);
   }

  ngOnInit(): void {
    if (this.wallet.syncConnected) {
      this.loadData();
    }
    this.wallet.syncConnectedEvent.subscribe(() => {
      this.loadData();
    });
  }

  async loadData() {
    this.l1EthBalance = new BigNumber(await this.wallet.web3.eth.getBalance(this.wallet.userAddress)).div(this.constants.PRECISION);
    this.l2EthBalance = new BigNumber((await this.wallet.syncWallet.getBalance("ETH"))/this.constants.PRECISION);
    this.withdrawFee = new BigNumber((await this.wallet.syncProvider.getTransactionFee('Withdraw', this.wallet.userAddress, 'ETH')).gasFee._hex).div(this.constants.PRECISION);
    this.maxL2WithdrawAmount = this.l2EthBalance.times(this.constants.PRECISION).minus(this.withdrawFee.times(this.constants.PRECISION)).div(this.constants.PRECISION);
  }

  setDepositAmount() {
    this.depositAmount = this.l1EthBalance;
  }

  setWithdrawAmount() {
    this.withdrawAmount = this.maxL2WithdrawAmount;
  }

  async depositETH() {
    await this.wallet.depositETH(new BigNumber(this.depositAmount).times(this.constants.PRECISION).integerValue().toFixed());
  }

  async withdrawETH() {
    let withdrawFee = new BigNumber((await this.wallet.syncProvider.getTransactionFee('Withdraw', this.wallet.userAddress, 'ETH')).gasFee._hex);
    let newWithdrawAmount = new BigNumber(this.withdrawAmount).times(this.constants.PRECISION).integerValue();
    if (newWithdrawAmount.plus(withdrawFee).gt(this.l2EthBalance.times(this.constants.PRECISION))) {
      newWithdrawAmount = newWithdrawAmount.minus(withdrawFee);
    }
    this.withdrawFee = withdrawFee.div(this.constants.PRECISION);
    this.maxL2WithdrawAmount = newWithdrawAmount.div(this.constants.PRECISION);
    await this.wallet.withdrawETH(newWithdrawAmount.toFixed());
  }
}
