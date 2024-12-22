export enum OptionType {
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
