  <template>
  <div class="proposal-container" v-on:click="showDetailsClick">
    <div class="tooltip-chart" :style="'top:' + tooltipPosY + 'px; left:'+ tooltipPosX + 'px; border-color:'+tooltipBorderColor" v-if="showChartTooltip">
      <span>{{ $t("GOVERNANCE_VIEW.VOTING_OPTIONS." + tooltipOption) }}</span>
      <span><b>{{tooltipValue}}</b></span>
    </div>

    <div class="top">
      <span class="id fw-bold">#{{ proposal.proposalId }} </span>
      <div v-if="proposal.status == 'PROPOSAL_STATUS_VOTING_PERIOD'" class="voting-status voting">
        <Icon :name=icons.get(proposal.status)>
        </Icon> {{ $t("GOVERNANCE_VIEW."+proposal.status)  }}
      </div>
      <div v-if="proposal.status == 'PROPOSAL_STATUS_REJECTED'" class="voting-status rejected">
        <Icon :name=icons.get(proposal.status)>
        </Icon> {{ $t("GOVERNANCE_VIEW."+proposal.status)  }}
      </div>
      <div v-if="proposal.status == 'PROPOSAL_STATUS_PASSED'" class="voting-status accepted">
        <Icon :name=icons.get(proposal.status)>
        </Icon> {{ $t("GOVERNANCE_VIEW."+proposal.status)  }}
      </div>
      <div v-if="proposal.status == 'PROPOSAL_STATUS_DEPOSIT_PERIOD'" class="voting-status deposit">
        <Icon :name=icons.get(proposal.status)>
        </Icon> {{ $t("GOVERNANCE_VIEW."+proposal.status)  }}
      </div>
      <div v-if="proposal.status == 'PROPOSAL_STATUS_FAILED'" class="voting-status failed">
        <Icon :name=icons.get(proposal.status)>
        </Icon> {{ $t("GOVERNANCE_VIEW."+proposal.status)  }}
      </div>
    </div>

    <div class="middle">
      <div>
        <h5 class="fw-bold">{{ proposal.content.title }}</h5>
      </div>
      <div class="voting-date">
        <div class="start-date">
          <div>
            <DateCommon :date="proposal.isDepositPeriod() ? proposal.submitTime : proposal.votingStartTime"/>
          </div>
          <div class="green-background">{{ proposal.isDepositPeriod() ? $t("GOVERNANCE_VIEW.SUBMIT_TIME") : $t("GOVERNANCE_VIEW.VOTING_START") }}</div>
        </div>
        <div class="end-date">
          <div>
            <DateCommon :date="proposal.isDepositPeriod() ? proposal.depositEndTime : proposal.votingEndTime"/>
          </div>
          <div class="blue-background">{{ proposal.isDepositPeriod() ? $t("GOVERNANCE_VIEW.DEPOSIT_END_TIME") : $t("GOVERNANCE_VIEW.VOTING_END") }}</div>
        </div>
      </div>
    </div>
    <div class="bottom" @mousemove="updateTooltipPosition($event)" v-if="proposal.status !== ProposalStatus.DEPOSIT_PERIOD">
      <div style="height:20px" class="chartdiv">
        <div @mouseover="showTooltip('YES', (yesPercentage * 100).toFixed(2) + '%')" @mouseout="hideTooltip" class="yes" :style="'flex-basis:' + yesPercentage * 100 + '%'"></div>
        <div @mouseover="showTooltip('ABSTAIN', (abstainPercentage * 100).toFixed(2) + '%')" @mouseout="hideTooltip" class="abstain" :style="'flex-basis:' + abstainPercentage * 100 + '%'"></div>
        <div @mouseover="showTooltip('NO', (noPercentage * 100).toFixed(2) + '%')" @mouseout="hideTooltip" class="no" :style="'flex-basis:' + noPercentage * 100 + '%'"></div>
        <div @mouseover="showTooltip('NO_WITH_VETO', (noWithVetoPercentage).toFixed(2) * 100 + '%')" @mouseout="hideTooltip" class="no-with-veto" :style="'flex-basis:' + noWithVetoPercentage * 100 + '%'"></div>
        <!-- <v-chart :option="option" /> -->
      </div>



      <div class="voting-result">
        <div style="display: flex; align-items: center">
          <div class="dot yes"></div>
          <div class="bar-legend">
            <div>{{ $t("GOVERNANCE_VIEW.VOTING_OPTIONS.YES") }}</div>
            <div>
              <b><PercentsView :amount="yesPercentage" :precision="2"/></b>
            </div>
<!--            (<CoinAmount :amount="useProposalsStore().getProposalTally(proposal).yes" :reduce-big-number="true" :precision="2"/>)-->
            (<CoinAmount :amount="new BigIntWrapper(useProposalsStore().getProposalTally(proposal).yes)" :reduce-big-number="true" :precision="2"/>)
          </div>
        </div>
        <div style="display: flex; align-items: center">
          <div class="dot abstain"></div>
          <div class="bar-legend">
            <div>{{ $t("GOVERNANCE_VIEW.VOTING_OPTIONS.ABSTAIN") }}</div>
            <div>
              <b><PercentsView :amount="abstainPercentage" :precision="2"/></b>
            </div>
<!--            (<CoinAmount :amount="useProposalsStore().getProposalTally(proposal).abstain" :reduce-big-number="true" :precision="2"/>)-->
            (<CoinAmount :amount="new BigIntWrapper(useProposalsStore().getProposalTally(proposal).abstain)" :reduce-big-number="true" :precision="2"/>)
          </div>
        </div>
        <div style="display: flex; align-items: center">
          <div class="dot no"></div>
          <div class="bar-legend">
            <div>{{ $t("GOVERNANCE_VIEW.VOTING_OPTIONS.NO") }}</div>
            <div>
              <b><PercentsView :amount=" noPercentage" :precision="2"/></b>
            </div>
<!--            (<CoinAmount :amount="useProposalsStore().getProposalTally(proposal).no" :reduce-big-number="true" :precision="2"/>)-->
            (<CoinAmount :amount="new BigIntWrapper(useProposalsStore().getProposalTally(proposal).no)" :reduce-big-number="true" :precision="2"/>)
          </div>
        </div>
        <div style="display: flex; align-items: center">
          <div class="dot no-with-veto"></div>
          <div class="bar-legend">
            <div>{{ $t("GOVERNANCE_VIEW.VOTING_OPTIONS.NO_WITH_VETO") }}</div>
            <div>
              <b><PercentsView :amount="noWithVetoPercentage" :precision="2"/></b>
            </div>
<!--            (<CoinAmount :amount="useProposalsStore().getProposalTally(proposal).noWithVeto" :reduce-big-number="true" :precision="2"/>)-->
            (<CoinAmount :amount="new BigIntWrapper(useProposalsStore().getProposalTally(proposal).noWithVeto)" :reduce-big-number="true" :precision="2"/>)
          </div>
        </div>
      </div>

    </div>

  </div>


</template>

<script setup lang="ts">
import {computed, ref} from "vue";
import {BarChart} from "echarts/charts";
import { use } from "echarts/core";
import {SVGRenderer} from "echarts/renderers";
import {LegendComponent, TitleComponent, TooltipComponent, GridComponent} from "echarts/components";
import {useRouter} from "vue-router";
import {Proposal, ProposalStatus} from "@/models/store/proposal";
import { createProposalListChartData } from '@/charts/governance';
import { useProposalsStore } from '@/store/proposals.store';
import CoinAmount from '../commons/CoinAmount.vue';
import PercentsView from "@/components/commons/PercentsView";
import DateCommon from "@/components/commons/DateCommon.vue";
import { useConfigurationStore } from '@/store/configuration.store';
import {BigIntWrapper} from "@/models/store/common";

use([
  SVGRenderer,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
]);

const props = defineProps<{
  proposal: Proposal
}>();


const router = useRouter();

const icons  = new Map<string, string>([
  [ProposalStatus.PASSED, "CheckSquare"],
  [ProposalStatus.REJECTED, "XCircle"],
  [ProposalStatus.DEPOSIT_PERIOD, ""],
  [ProposalStatus.FAILED, ""],
  [ProposalStatus.VOTING_PERIOD, ""],
  [ProposalStatus.UNSPECIFIED, ""]
]);

const tooltipOption = ref('');
const tooltipValue = ref('');
const showChartTooltip = ref(false);
const tooltipPosX = ref(0);
const tooltipPosY = ref(0);
const tooltipBorderColor = ref('');

const showTooltip = (option, value) => {
  if(option == 'YES') {
    tooltipBorderColor.value = '#72bf44';
  }
  if(option == 'ABSTAIN') {
    tooltipBorderColor.value = '#27697f';
  }
  if(option == 'NO') {
    tooltipBorderColor.value = '#861010';
  }
  if(option == 'NO_WITH_VETO') {
    tooltipBorderColor.value = '#FDDB2A';
  }
  tooltipOption.value = option;
  tooltipValue.value = value;
  showChartTooltip.value = true;
};

const updateTooltipPosition = (e) => {
  let x = e.clientX;
  let y = e.clientY;

  tooltipPosX.value = x;
  tooltipPosY.value = y - 80;
};

function hideTooltip(){
    showChartTooltip.value = false;
}

const yesPercentage = computed(() => {
  return useProposalsStore().getProposalTally(props.proposal).getYesPercentage();
});

const noPercentage = computed(() => {
  return useProposalsStore().getProposalTally(props.proposal).getNoPercentage();
});

const abstainPercentage = computed(() => {
  return useProposalsStore().getProposalTally(props.proposal).getAbstainPercentage();
});

const noWithVetoPercentage = computed(() => {
  return useProposalsStore().getProposalTally(props.proposal).getNoWithVetoPercentage();
});

const yes = computed(() => {
  return useConfigurationStore().config.getConvertedAmount(useProposalsStore().getProposalTally(props.proposal).yes);
});

const no = computed(() => {
  return useConfigurationStore().config.getConvertedAmount(useProposalsStore().getProposalTally(props.proposal).no);
});

const abstain = computed(() => {
  return useConfigurationStore().config.getConvertedAmount(useProposalsStore().getProposalTally(props.proposal).abstain);
});

const noWithVeto = computed(() => {
  return useConfigurationStore().config.getConvertedAmount(useProposalsStore().getProposalTally(props.proposal).noWithVeto);
});

const sumOfVotes = computed(() => {
  const val = useProposalsStore().getProposalTally(props.proposal).total;
  return val > 0n ? val : -1n;
});


const showDetailsClick = () => {
  router.push({name: 'governanceDetails', params: {id: props.proposal.proposalId}});
};

const option = computed(() => {
  return createProposalListChartData(
    {
      amount: yes.value,
      percentage: yesPercentage.value
    },
    {
      amount: abstain.value,
      percentage: abstainPercentage.value
    },
    {
      amount: no.value,
      percentage: noPercentage.value
    },
    {
      amount: noWithVeto.value,
      percentage: noWithVetoPercentage.value
    },
    sumOfVotes.value
  );
});


</script>

<style scoped lang="scss">
@import '../../styles/variables.scss';

.bar-legend {
  text-align: left;
  margin-left: 10px;
}
.proposal-container {
  min-height: 360px;
  box-shadow: -1px 1px 3px 3px rgba(0,0,0,0.1);
  border-radius: 10px;
  position: relative;
  overflow: hidden;
  @media (max-width: 1024px) {
    max-width: 100%;
    min-width: 100%;
  }

  &:hover {
    cursor: pointer;
    background: rgb(245, 245, 245);
  }

  .top {
    overflow: auto;
    .id {
      float: left;
      margin-top: 15px;
      margin-left: 25px;
      padding: 10px 15px;
      border: 2px solid black;
      border-radius: 15px;
    }
    .voting-status {
      float: right;
      height: 50px;
      width: 150px;
      padding: 15px 0px;
      margin-left: auto;
      margin-right: auto;
      border-radius: 0 10px 0 10px;
      display: flex;
      align-items: center;
      justify-content: center;

      svg {
        margin-right: 5px;
      }
    }

    .voting {
      background-color: $primary-blue-color;
      color: white;
    }

    .accepted {
      background-color: $primary-green-color;
      color: $primary-blue-color;
    }

    .rejected {
      background-color: $error-red-color;
      color: white;
    }

    .failed {
      background-color: black;
      color: white;
    }

    .deposit {
      background-color: grey;
      color: rgb(77, 77, 77);
    }
  }
  .middle {
    height: 50%;
    padding: 20px 30px;
    h5 {


    }
    .voting-date {
      padding-top: 15px;
      display: flex;
      justify-content: center;

      .start-date {
        padding-right: 20px;
        border-right: 1px solid;
        display: flex;
        flex-direction: column;
        align-items: center;


        .green-background {
          padding: 3px 10px;
          background-color: $success-color;
          width: fit-content;
          border-radius: 20px;
        }
      }

      .end-date {
        padding-left: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;

        .blue-background {
          padding: 3px 10px;
          background-color: $accents-link-color;
          width: fit-content;
          border-radius: 20px;
        }
      }
    }
  }

  .bottom {
    height: 25%;
    width: 100%;

    .voting-result {
      display: flex;
      justify-content: space-around;
    }
    .chartdiv {
      margin: 0 auto 15px auto;
      width: 90%;
      display: flex;
      border-radius: 15px;
      overflow: hidden;
      background: grey;

      div {
        height: 100%;
      }
    }
  }
}

.tooltip-chart {
  padding: 0.5em 1em;
  flex-direction: column;
  background: white;
  border-radius: 7px;
  border: 2px solid grey;
  color: black;
  z-index: 99999;
  position: fixed;
  display: flex;
}

.yes {
  background: $primary-green-color;
}

.no {
  background: $error-red-color;
}

.no-with-veto {
  background: #FDDB2A;
}

.abstain {
  background: #27697f;
}
</style>
