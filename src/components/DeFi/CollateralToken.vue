<template>
  <v-card class="mx-auto collateral-token" color="#222738" dark>
    <v-toolbar class="collateral-token-head" flat dense>
      <v-toolbar-title>
        <span>Collateral</span>
      </v-toolbar-title>
    </v-toolbar>

    <v-card-text class="collateral-content">
      <v-row class="collateral-label">
        <v-col cols="4">Assets</v-col>
        <v-col cols="5" class="text-right">Wallet</v-col>
        <v-col cols="3" class="text-center">Collateral</v-col>
      </v-row>
      <v-row
        class="collateral-item hvr-sweep-to-right"
        v-for="(item, index) in collateralList"
        :key="index"
        @click="switchToCollateral"
      >
        <v-col cols="4" class="assets">
          <img :src="require(`@/assets/icon/currency/${item.token.toLowerCase()}.svg`)" />
          <span>{{ item.token }}</span>
        </v-col>
        <v-col cols="5" class="balance">
          <span>{{ item.value.toFixed(2) }} {{ item.token }}</span>
        </v-col>
        <v-col cols="3" class="activate">
          <v-switch color="#060606" :hide-details="true" inset v-model="item.activated"></v-switch>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'

@Component({})
export default class CollateralToken extends Vue {
  collateralList = [
    {
      token: 'ECOC',
      value: 2000,
      activated: true
    },
    {
      token: 'USDT',
      value: 1000,
      activated: false
    },
    {
      token: 'ETH',
      value: 500,
      activated: false
    }
  ]

  switchToCollateral(event: any) {
    this.$emit('switchToCollateral', 'collateral')
  }
}
</script>

<style lang="scss" scoped>
.collateral-token-head {
  background: transparent linear-gradient(180deg, #2b3043 0%, #333848 100%) 0% 0% no-repeat
    padding-box;

  span {
    font-size: 18px;
  }
}

.collateral-item {
  align-items: center;
  background: #323646;
  border-radius: 6px;
  color: white;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  cursor: pointer;

  .assets {
    display: flex;
    place-items: center;

    img {
      width: 23px;
      margin-left: 0.5rem;
      margin-right: 1rem;
    }
  }

  .balance {
    text-align: right;
    small {
      opacity: 0.5;
    }
  }

  .activate {
    text-align: center;
  }
}

// .collateral-item:hover {
//   background: #42475c;
//   transition: 0.3s;
// }

.supply-item:nth-last-child(1) {
  margin-bottom: 0;
}
</style>

<style lang="scss">
.collateral-content {
  height: 220px;
  overflow: auto;
  .row {
    margin-left: 0;
    margin-right: 0;
  }

  .v-input--selection-controls {
    margin-top: 0;
    padding-top: 0;
  }

  .v-input__slot {
    margin-left: 6px;
    justify-content: center;
  }

  .v-input--switch__track {
    color: #060606 !important;
  }

  .v-input--is-label-active {
    color: #060606 !important;
    .v-input--switch__thumb {
      background: transparent linear-gradient(180deg, #c074f9 0%, #734597 100%) 0% 0% no-repeat
        padding-box;
    }
  }
}

.hvr-sweep-to-right {
  border-radius: 6px;
  cursor: pointer;
  vertical-align: middle;
  -webkit-transform: perspective(1px) translateZ(0);
  transform: perspective(1px) translateZ(0);
  position: relative;
  -webkit-transition-property: color;
  transition-property: color;
  -webkit-transition-duration: 0.3s;
  transition-duration: 0.3s;
}
.hvr-sweep-to-right:before {
  border-radius: 6px;
  content: '';
  position: absolute;
  z-index: -1;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #454a60;
  -webkit-transform: scaleX(0);
  transform: scaleX(0);
  -webkit-transform-origin: 0 50%;
  transform-origin: 0 50%;
  -webkit-transition-property: transform;
  transition-property: transform;
  -webkit-transition-duration: 0.3s;
  transition-duration: 0.3s;
  -webkit-transition-timing-function: ease-out;
  transition-timing-function: ease-out;
}
.hvr-sweep-to-right:hover,
.hvr-sweep-to-right:focus,
.hvr-sweep-to-right:active {
  color: white;
}
.hvr-sweep-to-right:hover:before,
.hvr-sweep-to-right:focus:before,
.hvr-sweep-to-right:active:before {
  -webkit-transform: scaleX(1);
  transform: scaleX(1);
}
</style>