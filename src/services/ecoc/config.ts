import { ECOC_MAINNET, ECOC_TESTNET } from './constants'

interface Config {
  apiProvider: string
  socketURL: string
}

const mainnetConfig = {
  networkStr: ECOC_MAINNET,
  apiProvider: 'https://explorer.ecoc.io/api',
  socketURL: 'https://explorer.ecoc.io/'
} as Config

const testnetConfig = {
  networkStr: ECOC_TESTNET,
  apiProvider: 'https://testnet.explorer.ecoc.io/api',
  socketURL: 'https://testnet.explorer.ecoc.io/'
} as Config

const defaultNetwork = ECOC_TESTNET

const getConfig = (networkStr: string) => {
  if (networkStr === ECOC_TESTNET) {
    return testnetConfig
  }

  return mainnetConfig
}

export { getConfig, defaultNetwork }