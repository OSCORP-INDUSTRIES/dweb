<template>
  <v-tabs grow :hide-slider="true" background-color="#17181C" dark class="br-tabs">
    <v-tab>{{ $t('views.lendingpage.borrow') }}</v-tab>
    <v-tab>{{ $t('views.lendingpage.repay') }}</v-tab>

    <v-tab-item class="br-tabs-item">
      <Borrow
        :currency="currency"
        :collateralBalance="collateralBalance"
        :borrowBalance="borrowBalance"
        :borrowLimit="borrowLimit"
        :interestRate="interestRate"
        :borrowPowerPercentage="borrowPowerPercentage"
      ></Borrow>
    </v-tab-item>

    <v-tab-item class="br-tabs-item">
      <Repay
        :currency="currency"
        :collateralBalance="collateralBalance"
        :borrowBalance="borrowBalance"
        :borrowLimit="borrowLimit"
        :interestRate="interestRate"
        :borrowPowerPercentage="borrowPowerPercentage"
      ></Repay>
    </v-tab-item>
  </v-tabs>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import Borrow from '@/components/DeFi/BorrowCard.vue'
import Repay from '@/components/DeFi/RepayCard.vue'
import { Currency } from '@/types/currency'

@Component({
  components: {
    Borrow,
    Repay
  }
})
export default class BorrowRepayMobile extends Vue {
  @Prop() currency!: Currency
  @Prop() collateralBalance!: number
  @Prop() borrowBalance!: number
  @Prop() borrowLimit!: number
  @Prop() borrowPowerPercentage!: number
  @Prop() interestRate!: number
}
</script>

<style lang="scss" scoped>
.br-tabs {
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
}

.br-tabs-item {
  background: #1d212e;
  color: white;
  padding: 2.5rem;
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
}

@media (max-width: 425px) {
  .br-tabs-item {
    padding: 2rem 1.25rem;
  }
}
</style>

<style lang="scss">
.br-tabs {
  .v-tab {
    color: #c074f9;
    font-weight: 800;
    text-transform: capitalize;
  }
  .v-tabs-items {
    background-color: transparent !important;
  }

  .v-tab--active {
    border-top-left-radius: 6px;
    border-top-right-radius: 6px;
    background: #1d212e !important;
  }
}
</style>
