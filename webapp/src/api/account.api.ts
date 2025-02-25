import {ServiceTypeEnum} from "@/services/logger/service-type.enum";
import TxBroadcastBaseApi, { TxData, TxBroadcastError } from "@/api/tx.broadcast.base.api";
import { ErrorData } from "@/api/base.api";
import { LogLevel } from '@/services/logger/log-level';

import { RequestResponse } from "@/models/request-response";
import { Account as StoreAccount } from "@/models/store/account";
import { Coin } from "@/models/store/common";

import { AccountResponse, BalanceResponse} from "@/models/blockchain/account";

import { useConfigurationStore } from "@/store/configuration.store";
import { ConnectionInfo } from "@/api/wallet.connecton.api";
import { mapAccount, createNonexistentAccount } from "@/models/mapper/account.mapper";
import { formatString } from "@/utils/string-formatter";
import queries from "./queries";

import {
  MsgBeginRedelegate,
  MsgDelegate,
  MsgUndelegate,
} from "cosmjs-types/cosmos/staking/v1beta1/tx";
import { MsgVote } from "cosmjs-types/cosmos/gov/v1beta1/tx";

import {
  MsgWithdrawDelegatorReward
} from "cosmjs-types/cosmos/distribution/v1beta1/tx";
import { DelegationsResponse, UnbondigDelegationsResponse } from "@/models/blockchain/staking";
import { Delegations, UnbondingDelegations } from "@/models/store/staking";
import { mapAndAddDelegations, mapAndAddUnbondingDelegations, mapDelegations, mapUnbondingDelegations } from "@/models/mapper/staking.mapper";
import { RewardsResponse } from "@/models/blockchain/distribution";
import { Rewards } from "@/models/store/distribution";
import { mapRewards } from "@/models/mapper/distribution.mapper";
import { mapCoin } from "@/models/mapper/common.mapper";
import { EncodeObject } from "@cosmjs/proto-signing";
import { BigDecimal } from "@/models/store/big.decimal";
import { VoteOption } from "@/models/store/proposal";
import { BlockchainApiErrorData } from "@/models/blockchain/common";
import {isNotNullOrUndefined} from "@vue/test-utils/dist/utils";



export class AccountApi extends TxBroadcastBaseApi {

  getServiceType(): ServiceTypeEnum {
    return ServiceTypeEnum.ACCOUNT_API;
  }

  private ACCOUNT_URL = queries.blockchain.ACCOUNT_URL;
  private BALANCE_URL = queries.blockchain.BALANCE_URL;
  private STAKED_AMOUNT_URL = queries.blockchain.STAKED_AMOUNT_URL;
  private UNSTAKED_AMOUNT_URL = queries.blockchain.UNSTAKED_AMOUNT_URL;
  private REWARDS_URL = queries.blockchain.REWARDS_URL;


  public async fetchAccount(address: string, lockscreen: boolean): Promise<RequestResponse<StoreAccount, ErrorData<BlockchainApiErrorData>>> {
    let accountNotFound = false;
    const displayAsError = (error: ErrorData<BlockchainApiErrorData>): boolean => {
      accountNotFound = AccountApi.isAccountNotFound(error.status, error.data);
      return !accountNotFound;
    };
    const handleError = (errorResponse: RequestResponse<AccountResponse, ErrorData<BlockchainApiErrorData>>): RequestResponse<StoreAccount, ErrorData<BlockchainApiErrorData>> => {
      if (accountNotFound) {
        return new RequestResponse<StoreAccount, ErrorData<BlockchainApiErrorData>>(undefined, createNonexistentAccount(address));
      }
      return new RequestResponse<StoreAccount, ErrorData<BlockchainApiErrorData>>(errorResponse.error);
    };
    const mapData = (bcData: AccountResponse | undefined) => {return mapAccount(bcData?.account);};
    return  await this.axiosGetBlockchainApiCall(formatString(this.ACCOUNT_URL, {address: address}),
      mapData, lockscreen, null, 'fetchAccount - ', displayAsError, handleError);
  }

  private static isAccountNotFound(status?: number, data?: BlockchainApiErrorData): boolean {
    const code = data?.code;
    const message = data?.message;
    return status === 404 && code === 5 && message !== undefined && /rpc error: code = NotFound/i.test(message);
  }

  public async fetchBalance(address: string, denom: string, lockscreen: boolean): Promise<RequestResponse<Coin, ErrorData<BlockchainApiErrorData>>>{
    const mapData = (bcData: BalanceResponse | undefined) => {return mapCoin(bcData?.balance, denom);};
    return  await this.axiosGetBlockchainApiCall(formatString(this.BALANCE_URL, {address: address, denom: denom}),
      mapData, lockscreen, null, 'fetchBalance - ');
  }

  public async fetchDelegations(address: string, lockscreen: boolean): Promise<RequestResponse<Delegations, ErrorData<BlockchainApiErrorData>>>{
    const mapData = (bcData: DelegationsResponse | undefined) => {return mapDelegations(bcData?.delegation_responses);};
    const mapAndAddData = (data: Delegations, bcData: DelegationsResponse | undefined) => {return mapAndAddDelegations(data, bcData?.delegation_responses);};

    return  await this.axiosGetAllBlockchainApiCallPaginated(formatString(this.STAKED_AMOUNT_URL, {address: address}),
            mapData, mapAndAddData, lockscreen, null, 'fetchDelegations - ');
  }
  public async fetchUnbondingDelegations(address: string, lockscreen: boolean): Promise<RequestResponse<UnbondingDelegations, ErrorData<BlockchainApiErrorData>>>{
    const mapData = (bcData: UnbondigDelegationsResponse | undefined) => {return mapUnbondingDelegations(bcData?.unbonding_responses);};
    const mapAndAddData = (data: UnbondingDelegations, bcData: UnbondigDelegationsResponse | undefined) => {return mapAndAddUnbondingDelegations(data, bcData?.unbonding_responses);};

    return  await this.axiosGetAllBlockchainApiCallPaginated(formatString(this.UNSTAKED_AMOUNT_URL, {address: address}),
            mapData, mapAndAddData, lockscreen, null, 'fetchUnbondingDelegations - ');
  }
  public async fetchRewards(address: string, lockscreen: boolean): Promise<RequestResponse<Rewards, ErrorData<BlockchainApiErrorData>>>{
    const mapData = (bcData: RewardsResponse | undefined) => {return mapRewards(bcData);};
    return  await this.axiosGetBlockchainApiCall(formatString(this.REWARDS_URL, {address: address}),
      mapData, lockscreen, null, 'fetchRewards - ');
  }
  public async delegate(connection: ConnectionInfo, validator: string, amount: number, reservedFee?: number | undefined): Promise<RequestResponse<TxData, TxBroadcastError>> {
    const config = useConfigurationStore().config;
    const bcAmount = new BigDecimal(amount).multiply(config.getViewDenomConversionFactor()).toFixed(0, false);
    const getMessages = (isLedger: boolean): readonly EncodeObject[] => {
      const typeUrl = '/cosmos.staking.v1beta1.MsgDelegate';
      const val = {
        delegatorAddress: connection.account,
        validatorAddress: validator,
        amount: {
          denom: config.stakingDenom,
          amount: bcAmount,
        }
      };
      if (isLedger) {
        return [{ typeUrl: typeUrl, value: val }];
      } else {
        return [{ typeUrl: typeUrl, value: MsgDelegate.fromPartial(val) }];
      }
    };
    let fee;
    if(reservedFee){
      fee=this.createFee(reservedFee, config.stakingDenom);
    } else {
      fee = this.createFee(config.operationGas.delegate, config.stakingDenom);
    }
    return await this.signAndBroadcast(connection, getMessages, fee, '', true, null);
  }
  public async simulate(connection: ConnectionInfo, validator: string, amount: number){
    const config = useConfigurationStore().config;
    const bcAmount = new BigDecimal(amount).multiply(config.getViewDenomConversionFactor()).toFixed(0, false);
    const getMessages = (isLedger: boolean): readonly EncodeObject[] => {
      const typeUrl = '/cosmos.staking.v1beta1.MsgDelegate';
      const val = {
        delegatorAddress: connection.account,
        validatorAddress: validator,
        amount: {
          denom: config.stakingDenom,
          amount: bcAmount,
        }
      };
      if (isLedger) {
        return [{ typeUrl: typeUrl, value: val }];
      } else {
        return [{ typeUrl: typeUrl, value: MsgDelegate.fromPartial(val) }];
      }
    };


    const fee = this.createFee(config.operationGas.delegate, config.stakingDenom);
    return await this.simulateDelegation(connection, getMessages, fee, '', true, null);
  }
  // public async simulateDelegation(connection: ConnectionInfo, validator: string, amount: string): Promise<RequestResponse<TxData, TxBroadcastError>> {
  //   const config = useConfigurationStore().config;
  //   const bcAmount = new BigDecimal(amount).multiply(config.getViewDenomConversionFactor()).toFixed(0, false);
  //   const getMessages = (isLedger: boolean): readonly EncodeObject[] => {
  //     const typeUrl = '/cosmos.staking.v1beta1.MsgDelegate';
  //     const val = {
  //       delegatorAddress: connection.account,
  //       validatorAddress: validator,
  //       amount: {
  //         denom: config.stakingDenom,
  //         amount: bcAmount,
  //       }
  //     };
  //     if (isLedger) {
  //       return [{ typeUrl: typeUrl, value: val }];
  //     } else {
  //       return [{ typeUrl: typeUrl, value: MsgDelegate.fromPartial(val) }];
  //     }
  //   };
  //
  //
  //   const fee = this.createFee(config.operationGas.delegate, config.stakingDenom);
  //   return await this.simulateTransaction(connection, getMessages, fee, '', true, null);
  // }
  public async undelegate(connection: ConnectionInfo, validator: string, amount: number): Promise<RequestResponse<TxData, TxBroadcastError>> {
    const config = useConfigurationStore().config;
    this.logToConsole(LogLevel.DEBUG, 'undelegate');
    const bcAmount = new BigDecimal(amount).multiply(config.getViewDenomConversionFactor()).toFixed(0, false);

    const getMessages = (isLedger: boolean): readonly EncodeObject[] => {
      const typeUrl = '/cosmos.staking.v1beta1.MsgUndelegate';
      const val = {
        delegatorAddress: connection.account,
        validatorAddress: validator,
        amount: {
          denom: config.stakingDenom,
          amount: bcAmount,
        }
      };
      if (isLedger) {
        return [{ typeUrl: typeUrl, value: val }];
      } else {
        return [{ typeUrl: typeUrl, value: MsgUndelegate.fromPartial(val) }];
      }
    };

    const fee = this.createFee(config.operationGas.undelegate, config.stakingDenom);
    return await this.signAndBroadcast(connection, getMessages, fee, '', true, null);
  }

  public async redelegate(connection: ConnectionInfo, validatorSrc: string, validatorDst: string, amount: number): Promise<RequestResponse<TxData, TxBroadcastError>> {
    const config = useConfigurationStore().config;
    const bcAmount = new BigDecimal(amount).multiply(config.getViewDenomConversionFactor()).toFixed(0, false);

    const getMessages = (isLedger: boolean): readonly EncodeObject[] => {
      const typeUrl = '/cosmos.staking.v1beta1.MsgBeginRedelegate';
      const val = {
        delegatorAddress: connection.account,
        validatorSrcAddress: validatorSrc,
        validatorDstAddress: validatorDst,
        amount: {
          denom: config.stakingDenom,
          amount: bcAmount,
        }
      };
      if (isLedger) {
        return [{ typeUrl: typeUrl, value: val }];
      } else {
        return [{ typeUrl: typeUrl, value: MsgBeginRedelegate.fromPartial(val) }];
      }
    };

    const fee = this.createFee(config.operationGas.redelegate, config.stakingDenom);
    return await this.signAndBroadcast(connection, getMessages, fee, '', true, null);
  }

  // TODO proposalId as Long
  public async vote(connection: ConnectionInfo, option: VoteOption, proposalId: number): Promise<RequestResponse<TxData, TxBroadcastError>> {
    this.logToConsole(LogLevel.DEBUG, 'vote', String(option), String(proposalId));

    const config = useConfigurationStore().config;

    const getMessages = (isLedger: boolean): readonly EncodeObject[] => {
      const typeUrl = '/cosmos.gov.v1beta1.MsgVote';
      const val = {
        option: option.valueOf(),
        proposalId,
        voter: connection.account,
      };
      if (isLedger) {
        return [{ typeUrl: typeUrl, value: val }];
      } else {
        return [{ typeUrl: typeUrl, value: MsgVote.fromPartial(val) }];
      }
    };

    const fee = this.createFee(config.operationGas.vote, config.stakingDenom);
    return await this.signAndBroadcast(connection, getMessages, fee, '', true, null);
  }

  public async claimRewards(connection: ConnectionInfo, validatorsAddresses: IterableIterator<string>): Promise<RequestResponse<TxData, TxBroadcastError>> {
    const config = useConfigurationStore().config;
    const messages: EncodeObject[] = [];
    const getMessages = (isLedger: boolean): readonly EncodeObject[] | TxBroadcastError => {
      const typeUrl = '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward';

      for (const validator of validatorsAddresses) {
        const val = {
          delegatorAddress: connection.account,
          validatorAddress: validator,
        };
        const msg: EncodeObject = isLedger ? { typeUrl: typeUrl, value: val } : { typeUrl: typeUrl, value: MsgWithdrawDelegatorReward.fromPartial(val) };
        messages.push(msg);

      }
      if (messages.length === 0) {
        this.logToConsole(LogLevel.INFO, 'claimRewards: No rewards to claim');
        return new TxBroadcastError('No rewards to claim');
      }
      return messages;
    };



    const fee = this.createFee(config.operationGas.claimRewards, config.stakingDenom);
    return await this.signAndBroadcast(connection, getMessages, fee, '', true, null);
  }
}
