import { useSplashStore } from "@/store/splash.store";
import { createPinia, setActivePinia } from "pinia";
import apiFactory from "@/api/factory.api";
import axios from "axios";
import {
  createProposals,
  createProposalResponseData,
  createProposalsResponseData,
  expectProposal,
  expectProposals
} from "../utils/proposal.blockchain.data.util";
import { mockAxios } from "../utils/mock.util";

const mockedAxios = mockAxios();
// const mockedAxios = axios as jest.Mocked<typeof axios>;
const api = apiFactory.proposalsApi()
jest.mock("axios");

describe('test proposals API', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  });
  afterEach(() => {
    expect(useSplashStore().splashCounter).toBe(0);
    mockedAxios.request.mockClear();
  });

  it('fetch request provided', async ()=> {
    const proposals = {
      data: createProposalsResponseData()
    };

    mockedAxios.request.mockResolvedValue(proposals);
    const result = await api.fetchProposals('1', false)
    expect(result.response.isError()).toBe(false)
    expect(result.response.isSuccess()).toBe(true)
    expect(result.response.error).toBeUndefined()

    expectProposals(result.response.data);
  });
  it('gets proposals - no proposals', async () => {
    const proposals = {
      data: createProposalsResponseData(new Array(), new Array())
    };

    mockedAxios.request.mockResolvedValue(proposals);
    const result = await  api.fetchProposals('1', false);
    expect(result.response.isError()).toBe(false);
    expect(result.response.isSuccess()).toBe(true);
    expect(result.response.error).toBeUndefined()
    expect(result.response.data?.proposals.length).toBe(0);
    expect(result.response.data?.numberOfActive).toBe(0);
  });
  it('fetch request of one proposal', async ()=> {
    const proposal = {
      data: createProposalResponseData()
    };

    mockedAxios.request.mockResolvedValue(proposal);
    const result = await api.fetchProposalById(Number(proposal.data.proposal.proposal_id))
    expect(result.isError()).toBe(false)
    expect(result.isSuccess()).toBe(true)
    expect(result.error).toBeUndefined();
    expect(result.data).not.toBeUndefined();
    expect(result.data?.proposal.proposalId).toEqual(Number(proposal.data.proposal.proposal_id))
  });
});
