<template>
  <span><FormattedNumber :amount="amount" :precision="precision"/> %</span>
</template>

<script setup lang="ts">

import { BigDecimal } from "@/models/store/big.decimal";
import {computed, PropType} from "vue";
import FormattedNumber from "./FormattedNumber.vue";

// const props = defineProps<{
//   amount: bigint | number | BigDecimal ,
//   precision: number
// }>();

const props =  defineProps({
  amount: [Object, Number, BigDecimal] as PropType<bigint | number | BigDecimal>,
  precision: Number
});

const amount = computed(() => {
  if (typeof props.amount === 'number') {
    if (isNaN(props.amount)) {
      return Number.NaN;
    }
    return props.amount * 100;
  } else if (typeof props.amount === 'bigint') {
    return props.amount * 100n;
  } else {
    return props.amount.multiply(100);
  }
});
</script>

<style scoped>

</style>
