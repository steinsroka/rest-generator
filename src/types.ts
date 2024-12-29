export enum RestFileType {
  Rest = "REST",
  Flax = "FLAX",
  Url = "URL",
}

export enum ParamType {
  Query = "QUERY",
  Header = "HEADER",
  Body = "BODY",
  Path = "PATH",
  System = "SYSTEM",
}

export interface MethodInfo {
  name: string;
  params: {
    paramType: ParamType;
    name: string;
    type: string;
    required: boolean;
  }[];
  returnType: string;
  httpMethod: string;
  path: string;
}

export const MAVEN_PRODUCT_TYPES = [
  "ADMIN",
  "AUTH",
  "BILLING",
  "BUILDER",
  "CDMS",
  "CONVERTER",
  "CONVERTER-VALIDATOR",
  "DOCS",
  "DOCS-PDF",
  "ECOA",
  "EDC-EXTERNAL",
  "ERECRUITMENT",
  "OCR",
  "PORTAL",
  "SAFETY",
  "SIGN",
  "SSO",
  "TMF",
  "VALIDATOR",
  "VDR",
  "X",
];
