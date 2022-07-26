import { useSplashStore } from '@/store/splash.store';
import { useToast } from 'vue-toastification';
import { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { RequestResponse } from '@/models/request-response';
import { LogLevel } from '@/services/logger/log-level';
import { LoggedService } from '@/services/logged.service';
import { LocalSpinner } from "@/services/model/localSpinner";
import { PaginatedResponse } from '@/models/blockchain/pagination';

const toast = useToast();

export class BlockchainPagination {
  key?: string;
  limit?: number;
  reverse?: boolean;

  constructor(key?: string, limit?: number, reverse?: boolean) {
    this.key = key;
    this.limit = limit;
    this.reverse = reverse;
  }

}

export class ErrorData<D> {
  readonly name: string;
  readonly message: string;
  readonly status?: number;
  readonly data?: D;
  private readonly dataToInfo?: (data: D) => string

  constructor(name: string, message: string, status?: number, data?: D, dataToInfo?: (data: D) => string) {
    this.name = name;
    this.message = message;
    this.status = status;
    this.data = data;
    this.dataToInfo = dataToInfo;
  }

  getInfo(): string {
    let result = 'Name: ' + this.name + '\r\nMessage: ' + this.message;
    if (this.status !== undefined) {
      result += '\r\nStatus: ' + this.status;
    }

    if (this.data !== undefined) {
      if (this.dataToInfo == undefined) {
        result += '\r\nData: ' + this.data;
      } else {
        result += '\r\nData:\r\n' + this.dataToInfo(this.data);
      }
    }
    return result;
  }

}

export interface BlockchainApiErrorData {
  code: number;
  message: string;
  details?: string;

}

export default abstract class BaseApi extends LoggedService {
  protected getAxiosInstance: () => AxiosInstance;

  constructor(axiosInstanceProvider: () => AxiosInstance) {
    super();
    this.getAxiosInstance = axiosInstanceProvider;
  }

  protected async axiosHasuraCall<T>(config: AxiosRequestConfig, lockScreen: boolean, localSpinner: LocalSpinner | null, skipErrorToast = false): Promise<RequestResponse<T, ErrorData<any>>> {
    return await this.axiosCall<T, any>(config, lockScreen, localSpinner, skipErrorToast, '');
  }

  protected async axiosGetBlockchainApiPaginatedCall<T, BC extends PaginatedResponse>(
    url: string,
    pagination: BlockchainPagination | null,
    mapData: (bcData: BC | undefined) => T,
    lockScreen: boolean,
    localSpinner: LocalSpinner | null,
    logPrefix = '',
    displayAsError?: (error: ErrorData<BlockchainApiErrorData>) => boolean,
    handleError?: (errorResponse: RequestResponse<BC, ErrorData<BlockchainApiErrorData>>) => RequestResponse<T, ErrorData<BlockchainApiErrorData>>,
    skipErrorToast = false): Promise<{ response: RequestResponse<T, ErrorData<BlockchainApiErrorData>>, nextKey: string | null }>
  {
    let nextKey: string | null = null;
    const func = async (): Promise<RequestResponse<BC, ErrorData<BlockchainApiErrorData>>> => { 
      const result: RequestResponse<BC, ErrorData<BlockchainApiErrorData>> = await this.axiosGetBlockchainDataPaginatedCall(url, pagination, lockScreen, localSpinner, logPrefix, displayAsError, skipErrorToast);
      if (result.data !== undefined) {
        nextKey = result.data.pagination.next_key;
      }
      return result;
    }

    return { response: await this.axiosGetBlockchainApiCallGeneric(mapData, func, logPrefix, handleError, skipErrorToast), nextKey: nextKey };
  }

  protected async axiosGetBlockchainApiCall<T, BC>(
    url: string,
    mapData: (bcData: BC | undefined) => T,
    lockScreen: boolean,
    localSpinner: LocalSpinner | null,
    logPrefix = '',
    displayAsError?: (error: ErrorData<BlockchainApiErrorData>) => boolean,
    handleError?: (errorResponse: RequestResponse<BC, ErrorData<BlockchainApiErrorData>>) => RequestResponse<T, ErrorData<BlockchainApiErrorData>>,
    skipErrorToast = false): Promise<RequestResponse<T, ErrorData<BlockchainApiErrorData>>>
  {
    const func = (): Promise<RequestResponse<BC, ErrorData<BlockchainApiErrorData>>> => { return this.axiosBlockchainApiCall({
      method: 'GET',
      url: url
    }, lockScreen, localSpinner, logPrefix, displayAsError, skipErrorToast);}
    return this.axiosGetBlockchainApiCallGeneric(mapData, func, logPrefix, handleError, skipErrorToast);
  }

  // protected async axiosGetBlockchainApiPaginatedCall2<T, BC extends PaginatedResponse>(
  //   url: string,
  //   pagination: BlockchainPagination | null,
  //   mapData: (bcData: BC | undefined) => T,
  //   lockScreen: boolean,
  //   localSpinner: LocalSpinner | null,
  //   logPrefix = '',
  //   displayAsError?: (error: ErrorData<BlockchainApiErrorData>) => boolean,
  //   handleError?: (errorResponse: RequestResponse<BC, ErrorData<BlockchainApiErrorData>>) => RequestResponse<T, ErrorData<BlockchainApiErrorData>>,
  //   skipErrorToast = false): Promise<RequestResponse<T, ErrorData<BlockchainApiErrorData>>>
  // {
  //   const result: RequestResponse<BC, ErrorData<BlockchainApiErrorData>> = await this.axiosGetBlockchainDataPaginatedCall(
  //     url, pagination, lockScreen, localSpinner, logPrefix, displayAsError, skipErrorToast);
  //   if (result.isError()) {
  //     if (handleError === undefined) {
  //       return new RequestResponse<T, ErrorData<BlockchainApiErrorData>>(result.error);
  //     } else {
  //       return handleError(result);
  //     }
  //   }
  //   try {
  //     this.logToConsole(LogLevel.DEBUG, logPrefix + 'data to map: ' + this.getServiceType(), this.stringify(result.data));
  //     const mapped = mapData(result.data);
  //     return new RequestResponse<T, ErrorData<BlockchainApiErrorData>>(undefined, mapped);
  //   } catch (err) {
  //     const error = err as Error;
  //     this.logToConsole(LogLevel.ERROR, logPrefix + 'mapping error: ' + this.getServiceType(), error.message);
  //     return this.createErrorResponseWithToast(new ErrorData<BlockchainApiErrorData>(error.name, error.message), 'Mapping error: ', !skipErrorToast);
  //   }
  // }

  // protected async axiosGetBlockchainApiCall2<T, BC>(
  //   url: string,
  //   mapData: (bcData: BC | undefined) => T,
  //   lockScreen: boolean,
  //   localSpinner: LocalSpinner | null,
  //   logPrefix = '',
  //   displayAsError?: (error: ErrorData<BlockchainApiErrorData>) => boolean,
  //   handleError?: (errorResponse: RequestResponse<BC, ErrorData<BlockchainApiErrorData>>) => RequestResponse<T, ErrorData<BlockchainApiErrorData>>,
  //   skipErrorToast = false): Promise<RequestResponse<T, ErrorData<BlockchainApiErrorData>>>
  // {
  //   const result: RequestResponse<BC, ErrorData<BlockchainApiErrorData>> = await this.axiosBlockchainApiCall({
  //     method: 'GET',
  //     url: url
  //   }, lockScreen, localSpinner, logPrefix, displayAsError, skipErrorToast);
  //   if (result.isError()) {
  //     if (handleError === undefined) {
  //       return new RequestResponse<T, ErrorData<BlockchainApiErrorData>>(result.error);
  //     } else {
  //       return handleError(result);
  //     }
  //   }
  //   try {
  //     this.logToConsole(LogLevel.DEBUG, logPrefix + 'data to map: ' + this.getServiceType(), this.stringify(result.data));
  //     const mapped = mapData(result.data);
  //     return new RequestResponse<T, ErrorData<BlockchainApiErrorData>>(undefined, mapped);
  //   } catch (err) {
  //     const error = err as Error;
  //     this.logToConsole(LogLevel.ERROR, logPrefix + 'mapping error: ' + this.getServiceType(), error.message);
  //     return this.createErrorResponseWithToast(new ErrorData<BlockchainApiErrorData>(error.name, error.message), 'Mapping error: ', !skipErrorToast);
  //   }
  // }

  protected async axiosGetAllBlockchainApiCallPaginated<T, BC extends PaginatedResponse>(
    url: string,
    mapData: (bcData: BC | undefined) => T,
    mapAndAddData: (data: T, bcData: BC | undefined) => T,
    lockScreen: boolean,
    localSpinner: LocalSpinner | null,
    logPrefix = '',
    displayAsError?: (error: ErrorData<BlockchainApiErrorData>) => boolean,
    skipErrorToast = false): Promise<RequestResponse<T, ErrorData<BlockchainApiErrorData>>>
  {
    let data: T | undefined = undefined;
    let nextKey: string | null | undefined = undefined;
    do {
      const pagination = nextKey ? new BlockchainPagination(nextKey) : null;
      const result: RequestResponse<BC, ErrorData<BlockchainApiErrorData>>
        = await this.axiosGetBlockchainDataPaginatedCall<BC>(url, pagination, lockScreen, localSpinner, logPrefix, displayAsError, skipErrorToast);
      if (result.isError()) {
        return new RequestResponse<T, ErrorData<BlockchainApiErrorData>>(result.error);
      }
      nextKey = result.data?.pagination.next_key;
      try {
        if (data === undefined) {
          data = mapData(result.data);
        } else {
          data = mapAndAddData(data, result.data);
        }
      } catch (err) {
        const error = err as Error;
        this.logToConsole(LogLevel.ERROR, logPrefix + 'mapping error: ' + this.getServiceType(), error.message);
        return this.createErrorResponseWithToast(new ErrorData<BlockchainApiErrorData>(error.name, error.message), 'Mapping error: ', !skipErrorToast);
      }
    } while (data === undefined || (nextKey !== null && nextKey !== undefined));
    return new RequestResponse<T, ErrorData<BlockchainApiErrorData>>(undefined, data);
  }

  private async axiosGetBlockchainApiCallGeneric<T, BC>(
    mapData: (bcData: BC | undefined) => T,
    getFunction: () => Promise<RequestResponse<BC, ErrorData<BlockchainApiErrorData>>>,
    logPrefix: string,
    handleError: ((errorResponse: RequestResponse<BC, ErrorData<BlockchainApiErrorData>>) => RequestResponse<T, ErrorData<BlockchainApiErrorData>>) | undefined,
    skipErrorToast: boolean): Promise<RequestResponse<T, ErrorData<BlockchainApiErrorData>>>
  {
    const result: RequestResponse<BC, ErrorData<BlockchainApiErrorData>> = await getFunction();
    if (result.isError()) {
      if (handleError === undefined) {
        return new RequestResponse<T, ErrorData<BlockchainApiErrorData>>(result.error);
      } else {
        return handleError(result);
      }
    }
    try {
      this.logToConsole(LogLevel.DEBUG, logPrefix + 'data to map: ' + this.getServiceType(), this.stringify(result.data));
      const mapped = mapData(result.data);
      return new RequestResponse<T, ErrorData<BlockchainApiErrorData>>(undefined, mapped);
    } catch (err) {
      const error = err as Error;
      this.logToConsole(LogLevel.ERROR, logPrefix + 'mapping error: ' + this.getServiceType(), error.message);
      return this.createErrorResponseWithToast(new ErrorData<BlockchainApiErrorData>(error.name, error.message), 'Mapping error: ', !skipErrorToast);
    }
  }

  protected async axiosBlockchainApiCall<T>( // TODO make private
    config: AxiosRequestConfig,
    lockScreen: boolean,
    localSpinner: LocalSpinner | null,
    logPrefix = '',
    displayAsError?: ((error: ErrorData<BlockchainApiErrorData>) => boolean),
    skipErrorToast = false
    ): Promise<RequestResponse<T, ErrorData<BlockchainApiErrorData>>> 
  {
    return await this.axiosCall<T, BlockchainApiErrorData>(
      config,
      lockScreen,
      localSpinner,
      skipErrorToast,
      logPrefix,
      displayAsError,
      (data: BlockchainApiErrorData) => { return '\tCode: ' + data.code + '\r\n\tMessage: ' + data.message + ')'; }
    );
  }

  private async axiosGetBlockchainDataPaginatedCall<P extends PaginatedResponse>(
    url: string,
    pagination: BlockchainPagination | null,
    lockScreen: boolean,
    localSpinner: LocalSpinner | null,
    logPrefix = '',
    displayAsError?: (error: ErrorData<BlockchainApiErrorData>) => boolean,
    skipErrorToast = false): Promise<RequestResponse<P, ErrorData<BlockchainApiErrorData>>> {
    const paginationData: any = {};
    if (pagination) {
      if (pagination.key) { paginationData['pagination.key'] = pagination.key; }
      if (pagination.limit) { paginationData['pagination.limit'] = pagination.limit; }
      if (pagination.reverse) { paginationData['pagination.reverse'] = pagination.reverse; }
    }
    const result: RequestResponse<P, ErrorData<BlockchainApiErrorData>> = await this.axiosBlockchainApiCall({
      method: 'GET',
      url: url,
      params: paginationData
    }, lockScreen, localSpinner, logPrefix, displayAsError, skipErrorToast);
    return result;
  }

  private async axiosCall<T, E>(config: AxiosRequestConfig,
    lockScreen: boolean,
    localSpinner: LocalSpinner | null,
    skipErrorToast: boolean,
    logPrefix: string,
    displayAsError?: (error: ErrorData<E>) => boolean,
    dataToInfo?: (data: E) => string): Promise<RequestResponse<T, ErrorData<E>>> {
    this.before(lockScreen, localSpinner);
    try {
      this.logToConsole(LogLevel.DEBUG, logPrefix + 'Axios Request: ', this.stringify(config));
      const data = await this.getAxiosInstance().request<T>(config);
      this.logToConsole(LogLevel.DEBUG, logPrefix + 'Axios Response', this.stringify(data));
      return new RequestResponse<T, ErrorData<E>>(undefined, data.data);
    } catch (err) {

      const error = err as Error | AxiosError<E, any>;

      this.logToConsole(LogLevel.DEBUG, logPrefix + 'Axios Response', this.stringify(err));

      let errorResp: ErrorData<E>;

      if (error instanceof AxiosError && error.response != undefined) {
        errorResp = new ErrorData<E>(error.name, error.message, error.response.status, error.response.data, dataToInfo);
      } else {
        errorResp = new ErrorData<E>(error.name, error.message);
      }
      const isError = displayAsError !== undefined ? displayAsError(errorResp) : true;
      const logLevel = isError ? LogLevel.ERROR : LogLevel.DEBUG;
      this.logToConsole(logLevel, logPrefix + 'Axios Response', this.stringify(err));
      this.logToConsole(logLevel, logPrefix + 'Error data: ' + this.stringify(errorResp));

      return this.createErrorResponseWithToast(errorResp, 'Error sending HTTP request: ', !skipErrorToast && isError);
    } finally {
      this.after(lockScreen, localSpinner);
    }
  }

  before(lockScreen: boolean, localSpinner: LocalSpinner | null) {
    if (lockScreen) {
      useSplashStore().increment();
    }
    localSpinner?.turnOnFunction();
  }

  after(lockScreen: boolean, localSpinner: LocalSpinner | null) {
    if (lockScreen) {
      useSplashStore().decrement();
    }
    localSpinner?.turnOffFunction();
  }

  private createErrorResponseWithToast<T, E>(errorData: ErrorData<E>, toastMessageBeginning: string | undefined, showErrorToast: boolean): RequestResponse<T, ErrorData<E>> {
    if (showErrorToast) {
      toast.error(toastMessageBeginning + this.getServiceType() + '\r\n' + errorData.getInfo());
    }
    return new RequestResponse<T, ErrorData<E>>(errorData);
  }

  protected stringify(value: any): string {
    return JSON.stringify(value, (key, value) =>
      typeof value === 'bigint'
        ? value.toString()
        : value
    )
  }
}

