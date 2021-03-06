<template>
  <div class="lending-page">
    <v-row class="content-wrapper">
      <v-col xl="8" lg="8" md="12" sm="12" cols="12" class="content-1">
        <SupplyBalance :balance="collateralBalance" :isLiquidate="isLiquidation"></SupplyBalance>
        <div class="col-spacer"></div>
        <BorrowBalance
          :balance="borrowedBalance"
          :borrowLimit="borrowLimit"
          :isLiquidate="isLiquidation"
        ></BorrowBalance>
      </v-col>
      <v-col xl="4" lg="4" md="12" sm="12" class="content-2">
        <LendingActivity></LendingActivity>
      </v-col>
    </v-row>
    <v-row v-if="!isLargeMobileDevice" class="content-wrapper">
      <v-col xl="8" lg="8" md="12" sm="12" cols="12" class="content-3">
        <v-card dark class="tx-container">
          <v-toolbar class="supply-withdraw-wrapper" dense flat>
            <v-toolbar-title class="token-symbol">
              <img :src="selectedCurrency.style.icon" alt="" />
              <span> {{ selectedCurrency.name }}</span>
            </v-toolbar-title>
          </v-toolbar>

          <v-row class="content-wrapper">
            <v-col cols="6" class="inner-content pr-1">
              <transition name="fade" mode="out-in">
                <template v-if="mode === 'collateral'">
                  <v-card dark color="#1D212E" class="content-card">
                    <v-card-text class="wrapper">
                      <Collateral
                        :currency="selectedCurrency"
                        :collateralBalance="collateralBalance"
                        :borrowBalance="borrowedBalance"
                        :borrowLimit="borrowLimit"
                        :borrowPowerPercentage="selectedCollateralFactor"
                      ></Collateral>
                    </v-card-text>
                  </v-card>
                </template>
                <template v-else>
                  <v-card dark color="#1D212E" class="content-card">
                    <v-card-text class="wrapper">
                      <Borrow
                        :currency="selectedCurrency"
                        :collateralBalance="collateralBalance"
                        :borrowBalance="borrowedBalance"
                        :borrowLimit="borrowLimit"
                        :interestRate="interestRate"
                        :borrowPowerPercentage="selectedCollateralFactor"
                      ></Borrow>
                    </v-card-text>
                  </v-card>
                </template>
              </transition>
            </v-col>
            <v-col cols="6" class="inner-content pl-1">
              <transition name="fade" mode="out-in">
                <template v-if="mode === 'collateral'">
                  <v-card dark color="#1D212E" class="content-card">
                    <v-card-text class="wrapper">
                      <Withdraw
                        :currency="selectedCurrency"
                        :collateralBalance="collateralBalance"
                        :borrowBalance="borrowedBalance"
                        :borrowLimit="borrowLimit"
                        :borrowPowerPercentage="selectedCollateralFactor"
                      ></Withdraw>
                    </v-card-text>
                  </v-card>
                </template>
                <template v-else>
                  <v-card dark color="#1D212E" class="content-card">
                    <v-card-text class="wrapper">
                      <Repay
                        :currency="selectedCurrency"
                        :borrowBalance="borrowedBalance"
                        :borrowLimit="borrowLimit"
                        :interestRate="interestRate"
                      ></Repay>
                    </v-card-text>
                  </v-card>
                </template>
              </transition>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
      <v-col cols="4" class="content-4">
        <v-row>
          <v-col cols="12" class="pt-0 pb-0">
            <CollateralToken
              :collateralList="collateralList"
              @switchToCollateral="toCollateralToken"
              @onActivate="onActivate"
            ></CollateralToken>
          </v-col>
          <v-col cols="12" class="pb-0">
            <SupplyMarket :borrowList="borrowList" @switchToBorrow="toBorrowToken"></SupplyMarket>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
    <template v-else>
      <CollateralSupplyMobile
        @selectTab="tabChanged"
        @selectCollateralMobile="toCollateralMobile"
        @selectBorrowMobile="toBorrowMobile"
        :collateralList="collateralList"
        :currency.sync="selectedCurrency"
        :collateralBalance="collateralBalance"
        :borrowBalance="borrowedBalance"
        :borrowLimit="borrowLimit"
        :interestRate="interestRate"
        :borrowPowerPercentage="selectedCollateralFactor"
        :borrowList="borrowList"
      ></CollateralSupplyMobile>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { getModule } from 'vuex-module-decorators'
import WalletModule from '@/store/wallet'
import LendingModule from '@/store/lending'
import { getCurrency } from '@/store/common'
import { Currency } from '@/types/currency'
import SupplyBalance from '@/components/DeFi/SupplyBalance.vue'
import BorrowBalance from '@/components/DeFi/BorrowBalance.vue'
import LendingActivity from '@/components/DeFi/LendingActivity.vue'
import Collateral from '@/components/DeFi/CollateralCard.vue'
import Withdraw from '@/components/DeFi/WithdrawCard.vue'
import CollateralToken from '@/components/DeFi/CollateralToken.vue'
import SupplyMarket from '@/components/DeFi/SupplyMarket.vue'
import Borrow from '@/components/DeFi/BorrowCard.vue'
import Repay from '@/components/DeFi/RepayCard.vue'
import CollateralSupplyMobile from '@/components/DeFi/Mobile/CollateralSupplyMobile.vue'

@Component({
  components: {
    SupplyBalance,
    BorrowBalance,
    LendingActivity,
    Collateral,
    Withdraw,
    CollateralToken,
    SupplyMarket,
    Borrow,
    Repay,
    CollateralSupplyMobile
  }
})
export default class Lending extends Vue {
  walletStore = getModule(WalletModule)
  lendingStore = getModule(LendingModule)

  selectedCollateralFactor = this.collateralList[0].collateralFactor
  selectedCurrency = this.collateralList[0].currency

  mode = 'collateral'

  isLargeMobileDevice = false

  mounted() {
    this.isLargeMobileDevice = window.innerWidth < 1264
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    window.addEventListener('resize', function() {
      self.isLargeMobileDevice = this.window.innerWidth < 1264
    })
  }

  get isLoggedIn(): boolean {
    return this.walletStore.address != ''
  }

  get isLiquidation() {
    return this.lendingStore.isLiquidation
  }

  get myCollateral() {
    return this.lendingStore.myCollateralAssets
  }

  get myBorrowing() {
    return this.lendingStore.myBorrowing
  }

  get borrowLimit() {
    const currencyName = 'EFG'
    return this.lendingStore.borrowLimit * this.getCurrencyPrice(currencyName)
  }

  // get all dept * it's current price
  get borrowedBalance() {
    const currencyName = 'EFG'
    return this.lendingStore.borrowBalance * this.getCurrencyPrice(currencyName)
  }

  // get all collateral Amount * it's current price
  get collateralBalance() {
    return this.myCollateral.reduce(
      (prev, collateral) =>
        prev + collateral.amount * this.getCurrencyPrice(collateral.currency.name),
      0
    )
  }

  get interestRate() {
    return this.lendingStore.loan.interestRate
  }

  get collateralList() {
    const supportedAssets = this.lendingStore.supportedCollateralAssets.map(asset => {
      let currency = this.walletStore.currencies.find(
        currency => currency.name === asset.currencyName
      )

      if (!currency) {
        currency = getCurrency(asset.currencyName)
      }

      return {
        currency: currency as Currency,
        activated: asset.activated,
        collateralFactor: asset.collateralFactor
      }
    })

    return supportedAssets
  }

  get borrowList() {
    const loanCurrency = this.lendingStore.loan.currency
    return this.walletStore.currencies
      .filter(currency => {
        if (currency.tokenInfo && loanCurrency.contractAddress) {
          return currency.tokenInfo.address === loanCurrency.contractAddress
        }

        return currency.name === loanCurrency.name
      })
      .map(currency => {
        return {
          currency: currency,
          apy: this.lendingStore.loan.interestRate
        }
      })
  }

  getCurrencyPrice(currencyName: string): number {
    const currency = this.walletStore.currencies.find(currency => currency.name === currencyName)
    if (!currency) return 0
    return currency.price || 0
  }

  modeSwitch(val: string) {
    this.mode = val
  }

  toCollateralToken(currency: Currency) {
    this.mode = 'collateral'
    this.selectedCurrency = currency

    const collateral = this.collateralList.find(
      collateral => collateral.currency.name === currency.name
    )

    if (collateral) this.selectedCollateralFactor = collateral.collateralFactor
    else this.selectedCollateralFactor = 0
  }

  toBorrowToken(currency: Currency) {
    this.mode = 'borrow'
    this.selectedCurrency = currency
  }

  toCollateralMobile(currency: Currency) {
    this.selectedCurrency = currency

    const collateral = this.collateralList.find(
      collateral => collateral.currency.name === currency.name
    )

    if (collateral) this.selectedCollateralFactor = collateral.collateralFactor
    else this.selectedCollateralFactor = 0
  }

  toBorrowMobile(currency: Currency) {
    this.selectedCurrency = currency
  }

  tabChanged(index: any) {
    if (index === 1) {
      this.selectedCurrency = this.borrowList[0].currency
    } else {
      this.selectedCurrency = this.collateralList[0].currency
    }
  }

  onActivate(data: boolean) {
    return data
  }
}
</script>

<style lang="scss" scoped>
.content-card {
  width: 100%;
}

.wrapper {
  padding: 2rem;
  text-align: left;
}

.supply-withdraw-wrapper {
  width: inherit;
  background: transparent linear-gradient(270deg, #2e3344 0%, #303748 100%) 0% 0% no-repeat
    padding-box;
}

.token-symbol {
  display: flex;
  align-items: center;
  font-size: medium;

  img {
    width: 24px;
    margin-right: 0.8rem;
  }
}

.inner-content {
  &-left {
    padding: 0 4px 0 0;
  }

  &-right {
    padding: 0 0 0 4px;
  }
}

.col-spacer {
  margin-left: 4px;
  margin-right: 4px;
}

@media (max-width: 768px) {
  .col-spacer {
    padding-bottom: 12px;
  }
}
</style>
