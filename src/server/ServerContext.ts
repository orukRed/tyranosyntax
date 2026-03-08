/* eslint-disable @typescript-eslint/no-explicit-any */
import { Connection, TextDocuments } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";

import { TyranoInitializationOptions } from "../shared/protocol";
import { InformationWorkSpace } from "./InformationWorkSpace";
import { Parser } from "./Parser";
import { CrossFileContextManager } from "./CrossFileContextManager";

/**
 * Shared context passed to every handler module.
 */
export interface ServerContext {
  readonly connection: Connection;
  readonly documents: TextDocuments<TextDocument>;
  readonly infoWs: InformationWorkSpace;
  readonly parser: Parser;
  readonly crossFileCtx: CrossFileContextManager;
  getServerConfig(): TyranoInitializationOptions;
}
