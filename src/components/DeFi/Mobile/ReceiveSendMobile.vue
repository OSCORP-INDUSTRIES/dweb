<template>
  <v-tabs show-arrows grow background-color="#2F3446" dark class="rs-tabs">
    <v-tab
      ><v-icon class="mr-2">arrow_circle_down</v-icon>{{ $t('views.walletpage.receive') }}</v-tab
    >
    <v-tab><v-icon class="mr-2">arrow_circle_up</v-icon> {{ $t('views.walletpage.send') }}</v-tab>

    <v-tab-item class="rs-tabs-item">
      <div v-if="!address" class="empty-div"></div>
      <div v-else class="qr-wrapper">
        <VueQrcode
          class="qr-code"
          :value="address"
          :options="{ width: 180, height: 180 }"
        ></VueQrcode>
      </div>
      <div class="address-area">
        <p class="addr-label">ECOC {{ $t('views.walletpage.address') }}</p>
        <div class="copyable-addr">
          <div class="text-truncate addr">{{ address }}</div>
          <v-btn icon small dark class="copy" @click="copyAddress(address)">
            <v-icon small>content_copy</v-icon>
          </v-btn>
        </div>
      </div>
      <div class="copy-message">
        <transition name="fade" mode="out-in">
          <div class="copied" v-if="showCopy">Copied!</div>
        </transition>
      </div>
    </v-tab-item>

    <v-tab-item class="rs-tabs-item">
      <div class="text-center send-area">
        <div class="token-balance">
          <span class="text-left"
            >{{ selectedCurrencyName }} {{ $t('views.walletpage.balance') }}</span
          >
          <v-spacer></v-spacer>
          <span class="text-right"
            >{{ Number(selectedCurrencyBalance) | numberWithCommas({ fixed: [0, 8] }) }}
            {{ selectedCurrencyName }}</span
          >
        </div>
        <v-text-field
          dark
          ref="toAddrRef"
          :label="walletpage.to_Address"
          class="to-address-field"
          single-line
          solo
          hide-details="true"
          v-model="toAddr"
        >
          <template v-slot:append-outer>
            <div class="address-book" @click="displayContactList">
              <v-icon>book</v-icon>
            </div>
          </template>
        </v-text-field>
        <div class="contact-address" v-if="displayContact" v-click-outside="onClickOutside">
          <v-list-item-group color="#363a4a" class="address-list">
            <template v-if="'created' in contactList">
              <div class="empty-message">No contact address</div>
            </template>

            <template v-else>
              <v-list-item
                dark
                v-for="(contact, index) in contactList"
                :key="index"
                class="address-item"
                @click="selectAddress(contact.address)"
              >
                <v-icon class="mr-3">account_circle</v-icon>

                <v-list-item-content>
                  {{ contact.name }}
                  <small class="addr-value text-truncate">{{ contact.address }}</small>
                </v-list-item-content>
              </v-list-item>
            </template>
          </v-list-item-group>
        </div>
        <div class="withdraw-rate">
          <v-spacer></v-spacer>
          <span class="fb-btn" @click="withdrawAll(selectedCurrencyBalance)">{{
            $t('views.walletpage.withdraw_a')
          }}</span>
        </div>
        <v-text-field
          dark
          ref="amountRef"
          class="withdraw-amount"
          placeholder="0"
          :prefix="walletpage.amount"
          v-model="amount"
          :suffix="selectedCurrencyName"
          single-line
          solo
          type="number"
          pattern="[0-9]*"
          @keypress="restrictNumberDecimals($event, amount, 8)"
          hide-details="true"
        ></v-text-field>
        <v-btn
          dark
          depressed
          block
          large
          class="send-btn"
          :disabled="!isSendable"
          @click="onOpenModal()"
          >{{ $t('views.walletpage.send') }}</v-btn
        >
        <TransactionConfirmationModal
          :visible="confirmTxModal"
          :fromAddr="fromAddr"
          :toAddr="toAddr"
          :amount="amount"
          :currency="selectedCurrency"
          :txError="errorMsg"
          @onConfirm="onConfirm"
          @onClose="onClose"
        />
      </div>
    </v-tab-item>
  </v-tabs>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import VueQrcode from '@chenfengyuan/vue-qrcode'
import vClickOutside from 'v-click-outside'
import { getModule } from 'vuex-module-decorators'
import { SendPayload } from '@/types/wallet'
import { WalletParams } from '@/services/ecoc/types'
import * as constants from '@/constants'
import AddressBookModule from '@/store/address-book'
import WalletModule from '@/store/wallet'
import TransactionConfirmationModal from '@/components/modals/TransactionConfirmation.vue'
import { copyToClipboard } from '@/services/utils'
import { restrictNumberDecimals } from '@/services/utils'

@Component({
  components: {
    VueQrcode,
    TransactionConfirmationModal
  },
  directives: {
    clickOutside: vClickOutside.directive
  }
})
export default class ReceiveSendMobile extends Vue {
  addressStore = getModule(AddressBookModule)
  walletStore = getModule(WalletModule)

  restrictNumberDecimals = restrictNumberDecimals

  showCopy = false
  showQr = false

  confirmTxModal = false
  displayContact = false

  toAddr = ''
  amount: number | string = ''

  errorMsg = ''

  addrList = [
    {
      name: 'MXC',
      address: 'EJDKiMpQvUfHK5KKiKWoe3CT2Sm9CCWaVV'
    },
    {
      name: 'Bitrex',
      address: 'EJDKiMpQvUfHK5KKiKWoe3CT2Sm9CCWaVV'
    }
  ]

  get fromAddr() {
    return this.walletStore.address || ''
  }

  get isWalletReady() {
    return this.walletStore.isWalletUnlocked
  }

  get contactList() {
    return this.addressStore.addressBook
  }

  get ecocBalance() {
    return this.walletStore.ecoc
  }

  get selectedCurrencyName() {
    return this.selectedCurrency?.name || ''
  }

  get selectedCurrencyBalance() {
    return this.selectedCurrency?.balance || ''
  }

  get selectedCurrency() {
    return this.walletStore.selectedCurrency
  }

  get address() {
    return this.walletStore.address || ''
  }

  get walletpage() {
    return this.$t('views.walletpage')
  }

  get isSendable() {
    return !!this.toAddr && !!this.amount && this.walletStore.isWalletUnlocked
  }

  selectAddress(addr: string) {
    this.toAddr = addr
    this.displayContact = false
  }

  onClickOutside() {
    this.displayContact = false
  }

  onOpenModal() {
    if (this.toAddr && this.amount) {
      this.confirmTxModal = !this.confirmTxModal
    }
  }

  closeModal() {
    this.confirmTxModal = false
  }

  onSuccess() {
    this.toAddr = ''
    this.amount = 0
    this.closeModal()
    window.scrollTo(0, 0)
  }

  onError(errorMsg: string) {
    this.errorMsg = errorMsg
  }

  onConfirm(walletParams: WalletParams) {
    const payload = {
      currency: this.selectedCurrency,
      to: this.toAddr,
      amount: Number(this.amount),
      walletParams: walletParams
    } as SendPayload
    this.currencySend(payload)
  }

  currencySend(payload: SendPayload) {
    this.errorMsg = ''
    this.walletStore
      .send(payload)
      .then(txid => {
        this.walletStore.updateBalance()
        this.walletStore.addPendingTx({ txid: txid, txType: constants.TX_TRANSFER })
        this.onSuccess()
      })
      .catch(error => {
        this.onError(error.message)
      })
  }

  onClose() {
    this.closeModal()
  }

  withdrawAll(amount: number) {
    this.amount = amount
  }

  copyAddress(addr: string) {
    copyToClipboard(addr)
    this.showCopy = true

    setTimeout(() => {
      this.showCopy = false
    }, 1000)
  }

  displayContactList() {
    if (this.isWalletReady) {
      this.displayContact = !this.displayContact
    }
  }
}
</script>

<style lang="scss" scoped>
.rs-tabs {
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
}

.rs-tabs-item {
  background: #222738;
  color: white;
  padding: 1.2rem;
  border-bottom-left-radius: 5px;
  border-bottom-right-radius: 5px;
}

.qr-wrapper {
  text-align: center;
}
.qr-code {
  margin-top: 0.6rem;
  border-radius: 10px;
}

.address-area {
  text-align: left;
  padding: 12px 1rem 1rem 1rem;

  p {
    color: white;
  }
}

.copyable-addr {
  padding: 12px 12px 6px 12px;
  background: #363a4a;
  border-radius: 5px;
  display: flex;
  font-size: small;
  justify-content: space-between;

  .addr {
    margin: auto 0;
  }
}

.copy {
  margin-left: 6px;
  align-items: baseline;
}

.copy-message {
  height: 33px;
}
.copied {
  width: fit-content;
  margin: auto;
  background: #363a4a;
  border-radius: 6px;
  padding: 6px 1rem;
  color: #55e52b;
  font-size: small;
}

.empty-div {
  width: 180px;
  height: 180px;
  margin-bottom: 0.45rem;
  margin-top: 0.6rem;
  border-radius: 10px;
  background: #363a4a;
  margin-left: auto;
  margin-right: auto;
}

.address-book {
  background: #474d5d;
  padding: 12px;
  border-top-left-radius: 0;
  border-top-right-radius: 5px;
  border-bottom-right-radius: 5px;
  border-bottom-left-radius: 0;
  cursor: pointer;
}

.address-book:hover {
  background: #5e657b;
  transition: 0.3s;
}

.addr-label {
  font-size: small;
  margin-bottom: 0.25rem;
}

.to-address-field {
  border-top-right-radius: 5px;
  border-bottom-right-radius: 5px;
  background: #363a4a;
  margin: 0;
  border: 0;
  font-size: small;
}

.token-balance {
  padding: 1rem 8px;
  display: flex;
  color: white;
  font-size: small;
}

.withdraw-rate {
  display: flex;
  padding: 10px 8px;
  font-size: small;

  .fb-btn {
    text-decoration: underline;
    color: white;
    cursor: pointer;
    text-align: right;
  }
}

.withdraw-amount {
  font-size: small;
  text-align: right;
}

.withdraw-fee {
  display: flex;
  padding: 1.5rem 8px 8px 8px;
  color: white;

  .fee-value {
    opacity: 0.7;
  }
}

.total-withdraw {
  padding: 1rem;
  display: flex;
  background: #ffffff08;
  color: white;
  border-radius: 5px;
}

.send-btn {
  margin-bottom: 2rem;
  margin-top: 4.05rem;
  background-color: #363a4a !important;
  color: #c074f9;
  font-weight: bold;
}

.contact-address {
  z-index: 1;
  position: absolute;
  background: #363a4a;
  width: -webkit-fill-available;
  margin-right: 2rem;
  border-bottom-left-radius: 5px;
  border-bottom-right-radius: 5px;
  max-height: 232px;
  overflow: auto;
}

.address-list {
  border-bottom-left-radius: 5px;
  border-bottom-right-radius: 5px;
}

.address-item {
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.057);

  .addr-value {
    opacity: 0.5;
  }
}
.address-item:nth-last-child(1) {
  border-bottom: 0;
}
</style>

<style lang="scss">
.send-area {
  .v-input__slot {
    background: #363a4a !important;
    box-shadow: none !important;
  }
  .v-input__append-outer {
    margin: 0 !important;
  }
}

.withdraw-amount {
  .v-text-field__prefix {
    opacity: 0.6;
  }

  input {
    text-align: right;
  }
}
</style>

<style lang="scss">
.address-list {
  .v-list-item--active {
    background: #3d4254;
    color: white;
  }
}
v-dialog {
  border: 1pc solid red;
}
</style>

<style lang="scss">
.rs-tabs {
  .v-tabs-items {
    background-color: #222738 !important;
    background: #222738;
    border-bottom-left-radius: 5px;
    border-bottom-right-radius: 5px;
  }
  .v-tabs-slider {
    background-color: #c074f9;
  }
}
</style>
