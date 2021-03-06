<template>
  <v-card class="receive-token-card" dark color="#1D212E">
    <v-toolbar class="receive-head" flat dense>
      <v-toolbar-title>
        <v-icon class="head-icon">arrow_circle_down</v-icon>
        <span>{{ $t('views.walletpage.receive') }}</span>
      </v-toolbar-title>
    </v-toolbar>
    <v-card-text class="text-center">
      <div v-if="!address" class="empty-div"></div>
      <VueQrcode
        v-else
        class="qr"
        :value="address"
        :options="{ width: 200, height: 200 }"
      ></VueQrcode>
      <div class="address-area">
        <p class="mb-1">{{ selectedCurrencyName }} {{ $t('views.walletpage.address') }}</p>
        <div class="copyable-addr">
          <div class="text-truncate">{{ address }}</div>
          <v-btn icon small class="copy" @click="copyAddress(address)">
            <v-icon small>content_copy</v-icon>
          </v-btn>
        </div>
      </div>
      <div class="copy-message">
        <transition name="fade" mode="out-in">
          <div class="copied" v-if="showCopy">{{ $t('views.modal.copied') }}!</div>
        </transition>
      </div>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import VueQrcode from '@chenfengyuan/vue-qrcode'
import { getModule } from 'vuex-module-decorators'
import WalletModule from '@/store/wallet'
import { copyToClipboard } from '@/services/utils'

@Component({
  components: {
    VueQrcode
  }
})
export default class ReceiveToken extends Vue {
  walletStore = getModule(WalletModule)
  showCopy = false
  showQr = false

  get selectedCurrencyName() {
    return this.selectedCurrency?.name || ''
  }

  get selectedCurrency() {
    return this.walletStore.selectedCurrency
  }

  copyAddress(addr: string) {
    copyToClipboard(addr)
    this.showCopy = true

    setTimeout(() => {
      this.showCopy = false
    }, 1000)
  }

  get address() {
    return this.walletStore.address || ''
  }
}
</script>

<style lang="scss" scoped>
.receive-token-card {
  width: 100%;
}

.receive-head {
  background: transparent linear-gradient(270deg, #2b3043 0%, #333848 100%) 0% 0% no-repeat
    padding-box;

  span {
    font-size: 16px;
  }

  .head-icon {
    font-size: 20px;
    margin-right: 8px;
  }
}

.qr {
  margin: 2.78rem;
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
  justify-content: space-between;
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
  padding: 6px 2rem;
  color: #55e52b;
}

.empty-div {
  width: 200px;
  height: 200px;
  margin: 3rem;
  border-radius: 10px;
  background: #363a4a;
  margin-left: auto;
  margin-right: auto;
}
</style>
