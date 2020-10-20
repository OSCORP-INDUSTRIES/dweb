import * as constants from '@/constants'
import EcocWallet from '@/services/ecoc/ecoc-wallet'
import { Ecrc20 } from '@/services/ecrc20'
import { Currency, Ecrc20 as IEcrc20 } from '@/types/currency'
import { KeyStore } from '@/types/keystore'
import { createKeystore, getKeystoreContent, getKeystoreFromString } from '@/services/keystore'
import { WalletError } from '@/exceptions/wallet'
import { SendEcocPayload, SendEcrc20Payload, WalletParams } from './ecoc/types'
import * as utils from './utils'

const isEcrc20 = (currency: Currency) => {
  return currency.type === constants.TYPE_ECRC20
}

const sendRawTx = async (rawTransaction: string) => {
  const txid = await EcocWallet.sendRawTx(rawTransaction)
  return txid
}

const generateNewKeystore = async (password: string) => {
  // create new wallet default is mainnet
  const wallet = await EcocWallet.createNewWallet()

  if (!wallet) {
    throw new WalletError('Can not generate new wallet')
  }

  const keystore = createKeystore(wallet.getPrivKey(), password)
  return keystore
}

const getKeystore = (keystore: string) => {
  return getKeystoreFromString(keystore)
}

const importFromWif = (wif: string) => {
  // create new wallet default is mainnet
  const wallet = EcocWallet.restoreFromWif(wif)

  if (!wallet) {
    throw new WalletError('Could not import from WIF')
  }

  return wallet
}

const importFromKeystore = (keystore: string | KeyStore, password: string) => {
  const wif = getKeystoreContent(keystore, password)

  if (!wif) {
    throw new WalletError('Invalid keystore or password')
  }

  return importFromWif(wif)
}

const getEcocBalance = async (address: string) => {
  const addressInfo = await EcocWallet.getAddressInfo(address)
  const balance = addressInfo.balance - addressInfo.unconfirmedBalance

  const currency = {
    name: constants.ECOC,
    type: constants.TYPE_ECOC,
    style: constants.KNOWN_CURRENCY.ECOC,
    balance: balance.toString(),
    price: 0
  } as Currency

  return currency
}

const getEcrc20Balance = async (address: string) => {
  const tokensInfo = await EcocWallet.getEcrc20(address)
  const currencies = [] as Currency[]

  tokensInfo.forEach(token => {
    currencies.push({
      name: token.contract.symbol,
      type: constants.TYPE_ECRC20,
      style: Object.prototype.hasOwnProperty.call(constants.KNOWN_CURRENCY, token.contract.symbol)
        ? constants.KNOWN_CURRENCY[token.contract.symbol]
        : constants.KNOWN_CURRENCY['DEFAULT'],
      balance: utils.toDecimals(token.amount, token.contract.decimals),
      tokenInfo: {
        name: token.contract.name,
        symbol: token.contract.symbol,
        address: token.contract.contract_address,
        decimals: token.contract.decimals,
        totalSupply: token.contract.total_supply
      },
      price: 0
    } as Currency)
  })

  return currencies
}

export const sendEcocBalance = async (
  keystore: KeyStore,
  password: string,
  payload: SendEcocPayload
) => {
  const wallet = importFromKeystore(keystore, password)
  const rawTransaction = await wallet.generateTx(payload)
  const txid = await sendRawTx(rawTransaction)
  return txid
}

export const sendEcrc20Balance = async (
  keystore: KeyStore,
  password: string,
  currency: Currency,
  payload: SendEcrc20Payload
) => {
  if (!isEcrc20(currency)) {
    throw new WalletError("It's not ECRC-20 currency")
  }

  const tokenInfo = currency.tokenInfo as IEcrc20

  const wallet = importFromKeystore(keystore, password)
  const utxoList = await wallet.getUtxoList()
  const ecrc20 = new Ecrc20(tokenInfo)

  const walletParams = {
    address: wallet.address,
    keypair: wallet.keypair,
    utxoList: utxoList,
    fee: payload.fee,
    gasLimit: payload.gasLimit,
    gasPrice: payload.gasPrice
  } as WalletParams

  const rawTransaction = await ecrc20.transfer(payload.to, payload.amount, walletParams)
  const txid = await sendRawTx(rawTransaction)
  return txid
}

const getTxs = async (address: string) => {
  const txs = await EcocWallet.getTxList(address)
  return txs
}

export {
  sendRawTx,
  generateNewKeystore,
  importFromKeystore,
  getKeystore,
  getEcocBalance,
  getEcrc20Balance,
  getTxs,
  isEcrc20
}
