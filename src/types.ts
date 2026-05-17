import { type EditorMode } from "./editorFormatting";

export type RequestMethod = "GET" | "POST" | "PUT" | "DELETE";

export type InspectorTab = "Issues" | "Headers" | "Params" | "Cookies";

export type ProxyTab =
  | "Intercept"
  | "HTTP History"
  | "WebSockets"
  | "Match & Replace"
  | "Settings";

export type HttpRequest = {
  id: number;
  host: string;
  method: RequestMethod;
  path: string;
  status: number;
  type: string;
  length: string;
  time: string;
  risk: "Low" | "Medium" | "Info";
  request: string;
  response: string;
  headers: Array<[string, string]>;
  params: Array<[string, string]>;
  cookies: Array<[string, string]>;
  issue: {
    title: string;
    description: string;
  };
};

export type RepeaterItem = {
  id: string;
  name: string;
  method: RequestMethod;
  target: string;
  request: string;
  response: string;
  status: number;
  time: string;
  lastRun: string;
};

export type { EditorMode };
