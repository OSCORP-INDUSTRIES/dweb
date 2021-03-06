import { VuexModule, Module, Mutation, Action, MutationAction } from 'vuex-module-decorators'
import store from '@/store'
import {
  LendingPlatform,
  Loan,
  Pool,
  CollateralAsset,
  Collateral,
  MyActivity,
  MyAsset
} from '@/types/lending'
import { Currency } from '@/types/currency'
import * as constants from '@/constants'
import * as Ecoc from '@/services/wallet'
import * as utils from '@/services/utils'
import { Ecrc20 } from '@/services/ecrc20'
import { lending } from '@/services/lending'
import { WalletParams } from '@/services/ecoc/types'
import {
  loanCurrency,
  rewardCurrency as extendCurrency,
  getCurrencyDecimals,
  getTokenInfo
} from '@/store/common'

@Module({ dynamic: true, store, namespaced: true, name: 'lendingStore' })
export default class LendingModule extends VuexModule implements LendingPlatform {
  address = lending.address
  pools = [] as Pool[]

  borrowLimit = 0
  borrowBalance = 0

  loan = {
    poolAddr: '',
    currency: loanCurrency,
    amount: 0,
    timestamp: 0,
    interestRate: 0.03,
    exchangeRate: 0,
    interest: 0,
    EFGInitialRate: 0,
    lastGracePeriod: 0,
    remainingGPT: 0
  } as Loan

  myCollateralAssets = [
    {
      currency: {
        name: constants.ECOC,
        style: constants.KNOWN_CURRENCY[constants.ECOC]
      },
      amount: 0,
      collateralFactor: 0
    }
  ] as CollateralAsset[]

  supportedCollateralAssets = [
    {
      currencyName: 'ECOC',
      contractAddress: '',
      activated: false,
      collateralFactor: 0.6
    }
  ] as Collateral[]

  myActivity = [] as MyActivity[]
  myAssets = [] as MyAsset[]
  lastUpdate = 0
  isLiquidation = false
  status = constants.STATUS_SYNCED

  get myBorrowing() {
    return [
      {
        currency: this.loan.currency,
        interestRate: this.loan.interestRate,
        amount: this.loan.amount,
        price: this.loan.exchangeRate
      }
    ]
  }

  get loaner() {
    return this.pools
  }

  get allAssets() {
    const supportedCollateralAssets = this.supportedCollateralAssets.map(assets => {
      return assets.currencyName
    }) as string[]
    return [...supportedCollateralAssets, constants.EFG, constants.GPT]
  }

  @Mutation
  updateTime() {
    this.lastUpdate = new Date().getTime()
  }

  @Mutation
  updateStatus(status: string) {
    this.status = status
  }

  @Mutation
  clear() {
    this.loan = {
      poolAddr: '',
      currency: loanCurrency,
      amount: 0,
      timestamp: 0,
      interestRate: 0.03,
      exchangeRate: 0,
      interest: 0,
      EFGInitialRate: 0,
      lastGracePeriod: 0,
      remainingGPT: 0
    } as Loan

    this.myCollateralAssets = [
      {
        currency: {
          name: constants.ECOC,
          style: constants.KNOWN_CURRENCY[constants.ECOC]
        },
        amount: 0,
        collateralFactor: 0
      }
    ] as CollateralAsset[]

    this.supportedCollateralAssets = [
      {
        currencyName: 'ECOC',
        contractAddress: '',
        activated: false,
        collateralFactor: 0.6
      }
    ] as Collateral[]

    this.myAssets = [] as MyAsset[]
    this.isLiquidation = false
    this.borrowLimit = 0
    this.borrowBalance = 0
  }

  @MutationAction
  async updateSupprtedAssets() {
    try {
      const myCollateralAssets = (this.state as any).myCollateralAssets as CollateralAsset[]
      const contractAddresses = await lending.getAllAssets()

      const supportedCollateralAssets = await Promise.all(
        contractAddresses.map(async address => {
          const tokenInfo = await Ecrc20.getEcrc20Info(address)
          const currencyName = tokenInfo.symbol
          const contractAddress = tokenInfo.contract_address
          const collateralFactor = await lending.getCollateralRate(currencyName)

          const activated = !!myCollateralAssets.find(asset => asset.currency.name === currencyName)

          return {
            currencyName: currencyName,
            contractAddress: contractAddress,
            activated: activated,
            collateralFactor: collateralFactor
          } as Collateral
        })
      )

      const currencyName = 'ECOC'
      const collateralFactor = await lending.getCollateralRate(currencyName)
      const activated = !!myCollateralAssets.find(asset => asset.currency.name === currencyName)
        ?.amount

      const ecocAsset = {
        currencyName: currencyName,
        contractAddress: '',
        activated: activated,
        collateralFactor: collateralFactor
      } as Collateral

      supportedCollateralAssets.splice(0, 0, ecocAsset)

      return { supportedCollateralAssets }
    } catch (error) {
      return {}
    }
  }

  @MutationAction
  async updateBalance(address: string) {
    try {
      const decimals = getCurrencyDecimals(loanCurrency.name)

      const borrowLimitFull = await lending.getBorrowLimit(address)
      const debtInfo = await lending.getDebt(address)

      const borrowBalance = Number(utils.toDecimals(debtInfo.totalDebt, decimals).toFixed(8))

      const borrowLimit = utils.toDecimals(borrowLimitFull, decimals).toNumber()

      return { borrowBalance, borrowLimit }
    } catch (error) {
      return {}
    }
  }

  @MutationAction
  async updateLoan(address: string) {
    try {
      const loan = (this.state as any).loan
      const loanInfo = await lending.getLoanInfo(address)
      const decimals = getCurrencyDecimals(loanCurrency.name)

      if (loanInfo.interestRate <= 0) {
        loanInfo.interestRate = await lending.getInterestRate()
      }

      if (loanInfo.poolAddr === '') {
        loan.poolAddr = await lending.getUserPool(address)
      } else {
        loan.poolAddr = loanInfo.poolAddr
      }

      loan.amount = utils.toDecimals(loanInfo.amount, decimals).toNumber()
      loan.timestamp = loanInfo.timestamp
      loan.interestRate = loanInfo.interestRate
      loan.interest = loanInfo.interest
      loan.EFGInitialRate = loanInfo.EFGInitialRate
      loan.lastGracePeriod = loanInfo.lastGracePeriod
      loan.remainingGPT = loanInfo.remainingGPT

      return { loan }
    } catch (error) {
      return {}
    }
  }

  @MutationAction
  async updateCollateral(address: string) {
    try {
      let myCollateralAssets = (this.state as any).myCollateralAssets as CollateralAsset[]
      const res = await lending.getCollateralInfo(address)

      if (res.length < 1) {
        myCollateralAssets = [
          {
            currency: {
              name: constants.ECOC,
              style: constants.KNOWN_CURRENCY[constants.ECOC]
            },
            amount: 0,
            collateralFactor: 0
          }
        ] as CollateralAsset[]
      }

      res.forEach(collateral => {
        const decimals = getCurrencyDecimals(collateral.currencyName)
        const index = myCollateralAssets.findIndex(
          asset => asset.currency.name === collateral.currencyName
        )

        if (index < 0) {
          const newAsset = {
            currency: {
              name: collateral.currencyName,
              style: constants.KNOWN_CURRENCY[collateral.currencyName]
            },
            amount: utils.toDecimals(collateral.amount, decimals).toNumber(),
            collateralFactor: 0
          }

          myCollateralAssets.push(newAsset)
        } else {
          const myAsset = myCollateralAssets[index]

          myAsset.amount = utils.toDecimals(collateral.amount, decimals).toNumber()
          myCollateralAssets.splice(index, 1, myAsset)
        }
      })

      return { myCollateralAssets }
    } catch (error) {
      return {}
    }
  }

  @MutationAction
  async updateLoners() {
    try {
      const pools = (this.state as any).pools as Pool[]
      const allPools = await lending.getAllPools()

      allPools.forEach(async address => {
        const poolInfo = await lending.getPoolInfo(address)
        const members = await lending.listPoolUsers(address)
        const existingLoanerIndex = pools.findIndex(pool => pool.address === address)
        const loanDecimals = 8
        const capital = utils.toDecimals(poolInfo.capital, loanDecimals).toNumber()
        const remainingEFG = utils.toDecimals(poolInfo.remainingEFG, loanDecimals).toNumber()
        const totalBorrowers = members.length

        if (existingLoanerIndex < 0) {
          const newLoaner = {
            currency: loanCurrency,
            address: address,
            totalSupply: capital,
            remaining: remainingEFG,
            totalBorrowed: capital - remainingEFG,
            totalBorrowers: totalBorrowers
          } as Pool
          pools.push(newLoaner)
        } else {
          const existingLoaner = pools[existingLoanerIndex]

          existingLoaner.remaining = remainingEFG
          existingLoaner.totalBorrowed = existingLoaner.totalSupply - remainingEFG
          existingLoaner.totalBorrowers = totalBorrowers
          pools.splice(existingLoanerIndex, 1, existingLoaner)
        }
      })

      return { pools }
    } catch (error) {
      return {}
    }
  }

  @MutationAction
  async updateLiquidation(address: string) {
    try {
      const isLiquidation = await lending.canSeize(address)
      return { isLiquidation }
    } catch (error) {
      return {}
    }
  }

  @MutationAction
  async updateMyAssets(address: string) {
    try {
      const supportedCollateralAssets = (this.state as any)
        .supportedCollateralAssets as Collateral[]
      const currenciesName = supportedCollateralAssets.map(assets => {
        return assets.currencyName
      }) as string[]

      const allAssets = [...currenciesName, constants.EFG, constants.GPT]
      const myAssets = [] as MyAsset[]

      allAssets.forEach(async currencyName => {
        const fullAmount = await lending.getAssetBalance(currencyName, address)
        const decimals = getCurrencyDecimals(currencyName)
        const amount = utils.toDecimals(fullAmount, decimals).toNumber()

        myAssets.push({
          currency: {
            name: currencyName,
            style: constants.KNOWN_CURRENCY[currencyName]
          },
          amount: amount
        })
      })

      return { myAssets }
    } catch (error) {
      return {}
    }
  }

  @Action
  init() {
    this.context.commit('updateTime')
  }

  @Action
  synced() {
    this.context.commit('updateStatus', constants.STATUS_SYNCED)
    return constants.STATUS_SYNCED
  }

  @Action
  async logout() {
    this.context.commit('clear')
    return true
  }

  @Action({ rawError: true })
  async getEstimatedGPT(address: string) {
    try {
      const fullAmount = await lending.getEstimatedGPT(address)
      const tokenInfo = getTokenInfo(extendCurrency.name) // to do
      const decimals = tokenInfo.decimals
      const amount = utils.toDecimals(fullAmount, decimals).toNumber()

      return amount as number
    } catch (error) {
      return Promise.reject(error)
    }
  }

  @Action({ rawError: true })
  async depositCollateral(payloads: {
    currency: Currency
    amount: number
    poolAddress: string
    walletParams: WalletParams
  }) {
    const { currency, amount, poolAddress, walletParams } = payloads
    const currencyName = currency.name

    try {
      let rawTransaction
      if (currencyName === 'ECOC') {
        rawTransaction = await lending.depositECOC(amount, poolAddress, walletParams)
      } else {
        const tokenInfo = currency.tokenInfo
        if (!tokenInfo) {
          return Promise.reject(new Error('Wrong Currency'))
        }

        const token = new Ecrc20(tokenInfo)
        const decimals = tokenInfo.decimals
        const fullAmount = utils.fromDecimals(amount, decimals).toNumber()

        const allowance = await token.allowance(walletParams.address, lending.address)
        if (fullAmount > allowance) {
          // waiting for ecrc-20 approve
          const approveTx = await token.approve(lending.address, amount, walletParams)
          const approveTxid = await Ecoc.sendRawTx(approveTx)

          await Ecoc.waitForConfirmation(approveTxid)

          const newUtxos = await Ecoc.getUtxos(walletParams.address)
          walletParams.utxoList = newUtxos
        }

        rawTransaction = await lending.depositAsset(
          currencyName,
          fullAmount,
          poolAddress,
          walletParams
        )
      }

      const txid = await Ecoc.sendRawTx(rawTransaction)
      this.context.commit('updateStatus', constants.STATUS_PENDING)
      return txid
    } catch (error) {
      return Promise.reject(error)
    }
  }

  @Action({ rawError: true })
  async withdrawCollateral(payloads: {
    currency: Currency
    amount: number
    walletParams: WalletParams
  }) {
    const { amount, currency, walletParams } = payloads
    const currencyName = currency.name
    const decimals = getCurrencyDecimals(currencyName)
    const fullAmount = utils.fromDecimals(amount, decimals).toNumber()

    try {
      let rawTransaction
      if (currencyName === 'ECOC') {
        rawTransaction = await lending.withdrawECOC(fullAmount, walletParams)
      } else {
        rawTransaction = await lending.withdrawAsset(currencyName, fullAmount, walletParams)
      }

      const txid = await Ecoc.sendRawTx(rawTransaction)
      this.context.commit('updateStatus', constants.STATUS_PENDING)
      return txid
    } catch (error) {
      return Promise.reject(error)
    }
  }

  @Action({ rawError: true })
  async borrow(payloads: { amount: number; walletParams: WalletParams; currency: Currency }) {
    const { amount, walletParams, currency } = payloads

    if (!currency.tokenInfo) {
      return Promise.reject(new Error('Wrong Currency'))
    }

    const decimals = currency.tokenInfo.decimals
    const fullAmount = utils.fromDecimals(amount, decimals).toNumber()

    try {
      const rawTransaction = await lending.borrow(fullAmount, walletParams)
      const txid = await Ecoc.sendRawTx(rawTransaction)
      this.context.commit('updateStatus', constants.STATUS_PENDING)
      return txid
    } catch (error) {
      return Promise.reject(error)
    }
  }

  @Action({ rawError: true })
  async repay(payloads: { amount: number; walletParams: WalletParams; currency: Currency }) {
    const { amount, walletParams, currency } = payloads

    if (!currency.tokenInfo) {
      return Promise.reject(new Error('Wrong Currency'))
    }

    const token = new Ecrc20(currency.tokenInfo)
    const decimals = currency.tokenInfo.decimals
    const fullAmount = utils.fromDecimals(amount, decimals).toNumber()

    try {
      const allowance = await token.allowance(walletParams.address, lending.address)
      if (fullAmount > allowance) {
        // waiting for ecrc-20 approve
        const approveTx = await token.approve(lending.address, amount, walletParams)
        const approveTxid = await Ecoc.sendRawTx(approveTx)

        await Ecoc.waitForConfirmation(approveTxid)

        const newUtxos = await Ecoc.getUtxos(walletParams.address)
        walletParams.utxoList = newUtxos
      }

      const rawTransaction = await lending.repay(fullAmount, walletParams)
      const txid = await Ecoc.sendRawTx(rawTransaction)
      this.context.commit('updateStatus', constants.STATUS_PENDING)
      return txid
    } catch (error) {
      return Promise.reject(error)
    }
  }

  @Action({ rawError: true })
  async depositAsset(payloads: {
    currency: Currency
    poolAddress: string
    amount: number
    walletParams: WalletParams
  }) {
    const { currency, poolAddress, amount, walletParams } = payloads
    const currencyName = currency.name
    const tokenInfo = getTokenInfo(currencyName)
    const token = new Ecrc20(tokenInfo)
    const decimals = tokenInfo.decimals
    const fullAmount = utils.fromDecimals(amount, decimals).toNumber()

    try {
      const allowance = await token.allowance(walletParams.address, lending.address)
      if (fullAmount > allowance) {
        // waiting for ecrc-20 approve
        const approveTx = await token.approve(lending.address, amount, walletParams)
        const approveTxid = await Ecoc.sendRawTx(approveTx)

        await Ecoc.waitForConfirmation(approveTxid)

        const newUtxos = await Ecoc.getUtxos(walletParams.address)
        walletParams.utxoList = newUtxos
      }

      const rawTransaction = await lending.depositAsset(
        currencyName,
        fullAmount,
        poolAddress,
        walletParams
      )
      const txid = await Ecoc.sendRawTx(rawTransaction)
      this.context.commit('updateStatus', constants.STATUS_PENDING)
      return txid
    } catch (error) {
      return Promise.reject(error)
    }
  }
}
