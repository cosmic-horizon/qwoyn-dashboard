import {Amount} from "@/models/TotalSupply";
import { array } from "yup";

export interface Account {
  "@type": string,

}

export interface BaseAccount {
  address: string,
  pub_key: {
    "@type": string,
    key: string
  },
  account_number: string,
  sequence: string
}

export interface ContinuousVestingAccount {
  base_vesting_account: {
    base_account: BaseAccount,
    original_vesting?: [
      {
        denom: string,
        amount: string
      }
    ],
    delegated_free: [],
    delegated_vesting: [
      {
        denom: string,
        amount: string
      }
    ],
    end_time: string
  },
  start_time: string
}



export interface AccountResponse {
  account: Account
}
// export interface Balances{
//   balances: Array<Amount>,
//   pagination: object,
// }
export interface balances {
  balances: Array<Amount>,
  pagination: object
}
