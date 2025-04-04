import { catchError, firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { InternalServerErrorException } from '@nestjs/common';
import {
  CsvOrPdf,
  ERRORS,
  FormattedDataForEventCsv,
  FormattedDataForCompanyCsv,
  FormattedDataForSubcompanyCsv,
  FormattedEventForPdf,
  FormattedDataForSubcompanyPdf,
  FormattedDataForCompanyPdf,
  FormattedStaffListingForCsv,
  FormattedDepartmentsCardViewDataForCsv,
  FormattedDivisionsCardViewDataForCsv,
  FormattedPointOfInterestDataForCsv,
} from '../constants';
import { Company } from '../models';
import { handleError, headerOptions } from '../helpers';

export const getReportsFromLambda = async (
  bearerToken: string,
  httpService: HttpService,
  dataToConvert:
    | FormattedDataForEventCsv[]
    | FormattedDataForCompanyCsv[]
    | FormattedDataForSubcompanyCsv[]
    | { data: FormattedDataForSubcompanyPdf[] }
    | { data: FormattedDataForCompanyPdf[]; totalCompanies: number }
    | Company
    | FormattedEventForPdf
    | FormattedStaffListingForCsv[]
    | FormattedDepartmentsCardViewDataForCsv[]
    | FormattedDivisionsCardViewDataForCsv[]
    | FormattedPointOfInterestDataForCsv[]
    | any,
  fileType: CsvOrPdf,
  pdfType?: string,
  fileName?: string,
) => {
  const body = JSON.stringify({
    fileType,
    fileData: dataToConvert,
    pdfType,
    fileName,
  });

  const options = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: bearerToken,
    },
  };

  return await firstValueFrom(
    httpService.post(process.env['CSV_PDF_API_URL'], body, options).pipe(
      catchError((error: any) => {
        console.log(error);
        throw new InternalServerErrorException(ERRORS.SOMETHING_WENT_WRONG);
      }),
    ),
  );
};

export const putRequest = async (
  bearerToken: string,
  httpService: HttpService,
  body: any,
  url: string,
) => {
  const _body = JSON.stringify(body);

  const options = headerOptions(bearerToken);

  try {
    const response = await firstValueFrom(httpService.put(url, _body, options));
    if (response.status === 200 || response.status === 201) {
      return response.data;
    }
  } catch (error) {
    console.log(error);

    handleError(error);
  }
};

export const postRequest = async (
  bearerToken: string,
  httpService: HttpService,
  body: any,
  url: string,
) => {
  const _body = JSON.stringify(body);

  const options = headerOptions(bearerToken);

  try {
    const response = await firstValueFrom(
      httpService.post(url, _body, options),
    );
    if (response.status === 200 || response.status === 201) {
      return response.data;
    }
  } catch (error) {
    console.log(error);

    handleError(error);
  }
};

export const postRequestWithoutToken = async (
  httpService: HttpService,
  body: any,
  url: string,
) => {
  try {
    const response = await firstValueFrom(httpService.post(url, body));
    if (response.status === 200 || response.status === 201) {
      return response.data;
    }
  } catch (error) {
    console.log(error);

    handleError(error);
  }
};

export const getRequest = async (
  httpService: HttpService,
  url: string,
  queryParam: Record<string, any>,
) => {
  try {
    const options = {
      params: queryParam,
    };

    const response = await firstValueFrom(httpService.get(url, options));
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.log(error);
    handleError(error);
  }
};
