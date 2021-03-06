<template>
  <div>
    <p class="action-label" v-if="!isMobileDevice">{{ $t('views.lendingpage.collateral') }}</p>
    <div class="wallet-balance mb-2">
      <span class="text-left">{{ $t('views.lendingpage.wallet_bl') }}</span>
      <v-spacer></v-spacer>
      <span class="balance" @click="fillAmount(walletBalance)">
        {{ Number(walletBalance) | numberWithCommas({ fixed: [0, 2] }) }} {{ currencyName }}
      </span>
    </div>
    <v-text-field
      class="amount-input"
      :label="lendingpage.collateralamount"
      placeholder="0"
      :suffix="currencyName"
      height="43"
      color="#C074F9"
      dark
      pattern="[0-9]*"
      v-model="collateralAmount"
      type="number"
      :hint="tokenConversion"
      @keypress="restrictNumberDecimals($event, collateralAmount, 8)"
      persistent-hint
    ></v-text-field>
    <div class="borrow-power">
      <span class="label">{{ $t('views.lendingpage.borrow_po') }}</span>
      <v-progress-linear
        :value="calculateBPUsed(collateralAmount)"
        rounded
        color="#C074F9"
        background-color="#E4E4E4"
        class="borrow-bar"
        height="5"
      ></v-progress-linear>
    </div>
    <div class="borrow-used">
      <div class="text-left">{{ $t('views.lendingpage.borrow_power_used') }}</div>
      <v-spacer class="space"></v-spacer>
      <div class="bp-change">
        <span>{{ bpUsed | numberWithCommas({ fixed: [0, 2] }) }}%</span>
        &rarr;
        <span class="after-calculated"
          >{{
            Number(calculateBPUsed(collateralAmount)) | numberWithCommas({ fixed: [0, 2] })
          }}%</span
        >
      </div>
    </div>
    <div class="borrow-total mt-1 mb-3">
      <div class="text-left">{{ $t('views.lendingpage.borrow_limit') }}</div>
      <v-spacer class="space"></v-spacer>
      <div class="bt-change">
        <span>${{ borrowLimit | numberWithCommas({ fixed: [0, 5] }) }}</span>
        &rarr;
        <span class="after-calculated"
          >${{
            Number(calculateTotalBP(collateralAmount)) | numberWithCommas({ fixed: [0, 2] })
          }}</span
        >
      </div>
    </div>
    <v-divider dark />

    <v-btn
      @click="openCollateralmodals()"
      dark
      large
      block
      depressed
      :loading="!!onPendingTx"
      :disabled="!isCollateralable(collateralAmount, 'error')"
      :class="isCollateralable(collateralAmount, 'error') ? 'submit-btn' : 'submit-btn disabled'"
      >{{
        isCollateralable(collateralAmount, 'btn')
          ? lendingpage.deposit
          : $t('views.lendingpage.not_available')
      }}
      <template v-slot:loader>
        <v-progress-circular indeterminate :size="24" class="spinner"></v-progress-circular>
        <span class="ml-2" v-if="!isCollateralPendingType">{{
          $t('views.lendingpage.waiting')
        }}</span>
      </template>
    </v-btn>
    <Collatmodel
      :visible="collateralmodel"
      :toAddr="contractAddr"
      :amount="collateralAmount"
      :currency="currency"
      @onSuccess="onSuccess"
      @onClose="closeCollateralmodals"
    />
  </div>
</template>
<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { getModule } from 'vuex-module-decorators'
import WalletModule from '@/store/wallet'
import * as constants from '@/constants'
import LendingModule from '@/store/lending'
import { Currency } from '@/types/currency'
import Collatmodel from '@/components/modals/CollateralDeposit.vue'
import { restrictNumberDecimals } from '@/services/utils'

@Component({
  components: {
    Collatmodel
  }
})
export default class Collateral extends Vue {
  walletStore = getModule(WalletModule)
  lendingStore = getModule(LendingModule)

  restrictNumberDecimals = restrictNumberDecimals

  @Prop() currency!: Currency
  @Prop() collateralBalance!: number
  @Prop() borrowBalance!: number
  @Prop() borrowLimit!: number
  @Prop() borrowPowerPercentage!: number

  collateralmodel = false
  collateralAmount: number | string = ''
  isMobileDevice = false

  mounted() {
    this.isMobileDevice = window.innerWidth < 1264
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    window.addEventListener('resize', function() {
      self.isMobileDevice = this.window.innerWidth < 1264
    })
  }

  openCollateralmodals() {
    this.collateralmodel = !this.collateralmodel
  }

  closeCollateralmodals() {
    this.collateralmodel = !this.collateralmodel
  }

  onSuccess() {
    this.collateralAmount = 0
    this.closeCollateralmodals()
  }

  get onPendingTx() {
    const pendingList = [
      constants.ACTION_COLLATERAL,
      constants.ACTION_WITHDRAW,
      constants.ACTION_BORROW,
      constants.ACTION_REPAY,
      constants.ACTION_LIQUID_DEPOSIT,
      constants.ACTION_ASSETS_WITHDRAW
    ]
    return this.walletStore.pendingTransactions.find(tx => {
      return pendingList.includes(tx.actionType || '') && tx.status === constants.STATUS_PENDING
    })
  }

  get isCollateralPendingType() {
    return this.walletStore.pendingTransactions.find(tx => {
      return tx.actionType === constants.ACTION_COLLATERAL && tx.status === constants.STATUS_PENDING
    })
  }

  get contractAddr() {
    return this.lendingStore.address
  }

  get walletBalance() {
    const walletB = this.walletStore.currencies.find(currency => {
      return currency.name === this.currencyName
    })
    return walletB?.balance
  }

  get currencyName() {
    return this.currency.name
  }

  get currencyPrice() {
    return this.currency.price || 0
  }

  get bpUsed() {
    return (this.borrowBalance / this.borrowLimit) * 100 || 0
  }

  get tokenConversion() {
    return `${Number(this.collateralAmount)} ${this.currencyName} ≈ $${this.currencyPrice *
      Number(this.collateralAmount)}`
  }

  get lendingpage() {
    return this.$t('views.lendingpage')
  }

  fillAmount(amount: number) {
    this.collateralAmount = amount
  }

  // BP = Borrow Power
  calculateTotalBP(colAmount: number) {
    const dollarsAmount = Number(colAmount) * this.currencyPrice
    return this.borrowLimit + dollarsAmount * this.borrowPowerPercentage
  }

  calculateBPUsed(colAmount: number) {
    const dollarsAmount = Number(colAmount) * this.currencyPrice
    const newBpUsed =
      (this.borrowBalance / (dollarsAmount * this.borrowPowerPercentage + this.borrowLimit)) * 100
    return newBpUsed || 0
  }

  isCollateralable(amount: number, type: string) {
    const balance = Number(this.walletBalance) || this.currency.balance
    const isEnough = amount <= balance
    const isValidAmount = amount >= 0
    const isClickable = amount > 0
    const isNotBorrowedYet = this.borrowBalance <= 0

    if (type === 'error') {
      return isEnough && isClickable && isNotBorrowedYet
    }
    return isEnough && isValidAmount && isNotBorrowedYet
  }
}
</script>

<style lang="scss" scoped>
.collateral-card {
  width: 100%;
}

.wrapper {
  padding: 2rem;
  text-align: left;
}

.action-label {
  font-size: large;
  color: #c074f9;
  font-weight: 700;
  margin-bottom: 2rem;
}

.wallet-balance {
  display: flex;
  color: white;

  .balance {
    text-decoration: underline;
    cursor: pointer;
    text-align: right;
  }
}

.borrow-power {
  margin-top: 1rem;

  .label {
    font-weight: 700;
    color: white;
  }
  .borrow-bar {
    margin-top: 8px;
    margin-bottom: 12px;
  }
}

.borrow-total,
.borrow-used {
  display: flex;
  color: white;

  .bp-change {
    text-align: right;
  }

  .bt-change {
    text-align: right;
  }

  .after-calculated {
    color: #c074f9;
  }
}

.submit-btn {
  margin-top: 4.3rem;
  margin-bottom: 1.2rem;
  border-radius: 7px;
  font-weight: bold;
  background: transparent linear-gradient(90deg, #3ba7c1 0%, #59289a 100%) 0% 0% no-repeat
    padding-box;
}

.disabled {
  background: #8f8f8f !important;
  cursor: no-drop;
}

@media (max-width: 768px) {
  .wallet-balance,
  .borrow-power,
  .borrow-used,
  .borrow-total {
    font-size: small;
  }
}

@media (max-width: 425px) {
  .wallet-balance {
    flex-wrap: wrap;

    .balance {
      width: 100%;
    }
  }

  .borrow-used {
    flex-wrap: wrap;

    .bp-change {
      width: 100%;
    }
  }

  .borrow-total {
    flex-wrap: wrap;

    .bt-change {
      width: 100%;
    }
  }

  .space {
    flex-basis: 100%;
  }
}
</style>

<style lang="scss">
.amount-input {
  .v-label {
    color: white !important;
    font-weight: 700;
    margin-top: 8px;
  }

  .v-label--active {
    margin-top: 0;
  }

  input {
    text-align: right;
    font-size: 24px;
    color: #c074f9 !important;
    margin: 8px 0;
    font-weight: 300;
  }

  .v-text-field__suffix {
    opacity: 0.6;
    color: white !important;
    font-size: smaller;
    margin-left: 8px;
  }

  .v-messages {
    padding-top: 8px;
  }

  input:-internal-autofill-selected {
    appearance: menulist-button;
    background-color: transparent !important;
    background-image: none !important;
    color: #c074f9 !important;
  }

  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  input[type='number'] {
    -moz-appearance: textfield; /* Firefox */
  }
}
</style>
