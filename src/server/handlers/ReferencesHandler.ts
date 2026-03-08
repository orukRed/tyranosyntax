import {
  Location,
  ReferenceParams,
} from "vscode-languageserver/node";

import { ServerContext } from "../ServerContext";

export function register(ctx: ServerContext): void {
  const { connection } = ctx;

  connection.onReferences((_params: ReferenceParams): Location[] | null => {
    return null;
  });
}
