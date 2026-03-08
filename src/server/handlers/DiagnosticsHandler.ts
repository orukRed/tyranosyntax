/* eslint-disable no-control-regex */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Diagnostic,
  DiagnosticSeverity,
  Range,
  Position,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { URI } from "vscode-uri";
import * as fs from "fs";

import { ServerContext } from "../ServerContext";
import { getLineText, escapeRegExp } from "../ServerUtilities";
import { TyranoLogger, ErrorLevel } from "../TyranoLogger";

let isDiagnosing = false;

export function createRunDiagnosticForFile(
  ctx: ServerContext,
): (fileName: string) => Promise<void> {
  const { infoWs } = ctx;

  return async function runDiagnosticForFile(
    fileName: string,
  ): Promise<void> {
    if (!fileName.endsWith(".ks") || isDiagnosing) return;
    isDiagnosing = true;
    try {
      await infoWs.updateScenarioFileMap(fileName);
      await infoWs.updateMacroLabelVariableDataMapByKs(fileName);
      await runDiagnostics(ctx, fileName);
    } catch (error) {
      TyranoLogger.print("Diagnostic failed", ErrorLevel.ERROR);
      TyranoLogger.printStackTrace(error);
    } finally {
      isDiagnosing = false;
    }
  };
}

export async function runDiagnostics(
  ctx: ServerContext,
  _triggerFileName: string,
): Promise<void> {
  const { connection, infoWs, parser } = ctx;
  const serverConfig = ctx.getServerConfig();

  const executeDiagnostic = serverConfig.executeDiagnostic || {};
  const tyranoBuilderEnabled = serverConfig.tyranoBuilderEnabled || false;
  const tyranoBuilderSkipTags = serverConfig.tyranoBuilderSkipTags || [];
  const tyranoBuilderSkipParameters =
    serverConfig.tyranoBuilderSkipParameters || {};

  for (const [filePath, scenarioDocument] of infoWs.scenarioFileMap) {
    const projectPath = infoWs.getProjectPathByFilePath(filePath);
    if (!projectPath) continue;
    if (infoWs.isSkipParse(filePath, projectPath)) continue;

    const diagnostics: Diagnostic[] = [];
    const parsedData = parser.parseText(scenarioDocument.getText());

    for (const data of parsedData) {
      if (data["name"] === "comment" || data["name"] === "text") continue;

      // Undefined macro check
      if (isExecDiag(executeDiagnostic, "undefinedMacro")) {
        checkUndefinedMacro(
          infoWs,
          data,
          projectPath,
          filePath,
          scenarioDocument,
          diagnostics,
          tyranoBuilderEnabled,
          tyranoBuilderSkipTags,
        );
      }

      // Label name check
      if (isExecDiag(executeDiagnostic, "labelName")) {
        checkLabelName(data, scenarioDocument, diagnostics);
      }

      // Undefined parameter check
      if (isExecDiag(executeDiagnostic, "undefinedParameter")) {
        checkUndefinedParameter(
          infoWs,
          data,
          projectPath,
          scenarioDocument,
          diagnostics,
          tyranoBuilderEnabled,
          tyranoBuilderSkipTags,
          tyranoBuilderSkipParameters,
        );
      }

      // Missing ampersand in variable check
      if (isExecDiag(executeDiagnostic, "missingAmpersandInVariable")) {
        checkMissingAmpersandInVariable(data, scenarioDocument, diagnostics);
      }
    }

    // Missing scenarios and labels check
    if (isExecDiag(executeDiagnostic, "missingScenariosAndLabels")) {
      checkMissingScenariosAndLabels(
        infoWs,
        parser,
        parsedData,
        projectPath,
        filePath,
        scenarioDocument,
        diagnostics,
        tyranoBuilderEnabled,
      );
    }

    // jump/call in if statement check
    if (isExecDiag(executeDiagnostic, "jumpAndCallInIfStatement")) {
      checkJumpAndCallInIfStatement(parsedData, scenarioDocument, diagnostics);
    }

    // Macro duplicate check
    if (isExecDiag(executeDiagnostic, "macroDuplicate")) {
      checkMacroDuplicate(infoWs, projectPath, filePath, diagnostics);
    }

    // Parameter spacing check
    if (isExecDiag(executeDiagnostic, "parameterSpacing")) {
      checkParameterSpacing(scenarioDocument, diagnostics);
    }

    // Send diagnostics
    connection.sendDiagnostics({
      uri: URI.file(filePath).toString(),
      diagnostics,
    });
  }
}

function isExecDiag(
  executeDiagnostic: { [key: string]: boolean },
  key: string,
): boolean {
  return executeDiagnostic[key] === true;
}

function checkUndefinedMacro(
  infoWs: any,
  data: any,
  projectPath: string,
  _filePath: string,
  doc: TextDocument,
  diagnostics: Diagnostic[],
  tyranoBuilderEnabled: boolean,
  tyranoBuilderSkipTags: string[],
): void {
  if (
    data["name"] === "label" ||
    data["name"] === "comment" ||
    data["name"] === "text"
  )
    return;
  if (tyranoBuilderEnabled && tyranoBuilderSkipTags.includes(data["name"]))
    return;

  const suggestions = infoWs.suggestions.get(projectPath);
  if (!suggestions) return;

  const projectMacros = infoWs.defineMacroMap.get(projectPath);
  const isMacro = projectMacros
    ? Array.from(projectMacros.values()).some(
        (m: any) => m.macroName === data["name"],
      )
    : false;
  const isTag = (suggestions as any)[data["name"]] !== undefined;

  if (!isMacro && !isTag) {
    const lineText = getLineText(doc, data["line"]);
    const tagFirstIndex = lineText.indexOf(data["name"]);
    if (tagFirstIndex >= 0) {
      const range = Range.create(
        data["line"],
        tagFirstIndex,
        data["line"],
        tagFirstIndex + data["name"].length,
      );
      diagnostics.push(
        Diagnostic.create(
          range,
          `[${data["name"]}]は定義されていないタグ、もしくはマクロです。`,
          DiagnosticSeverity.Error,
        ),
      );
    }
  }
}

function checkLabelName(
  data: any,
  _doc: TextDocument,
  diagnostics: Diagnostic[],
): void {
  if (data["name"] !== "label" || data["pm"]["is_in_comment"] === true) return;
  const labelName = data["pm"]["label_name"];
  if (!labelName) return;

  const range = Range.create(
    Position.create(data["pm"]["line"], 0),
    Position.create(data["pm"]["line"], labelName.length + 1),
  );

  if (/^\d/.test(labelName)) {
    diagnostics.push(
      Diagnostic.create(
        range,
        `ラベル名 "${labelName}" は数字から始まっており、非推奨の可能性があります。`,
        DiagnosticSeverity.Warning,
      ),
    );
    return;
  }
  if (/\s/.test(labelName)) {
    diagnostics.push(
      Diagnostic.create(
        range,
        `ラベル名 "${labelName}" に空白文字が含まれています。空白文字は非推奨です。`,
        DiagnosticSeverity.Warning,
      ),
    );
    return;
  }
  if (!/^[a-zA-Z0-9_]+$/.test(labelName)) {
    if (/[^\x01-\x7E]/.test(labelName)) {
      diagnostics.push(
        Diagnostic.create(
          range,
          `ラベル名 "${labelName}" に日本語などの2バイト文字が含まれています。半角英数字とアンダースコアの使用を推奨します。`,
          DiagnosticSeverity.Warning,
        ),
      );
    } else {
      diagnostics.push(
        Diagnostic.create(
          range,
          `ラベル名 "${labelName}" に使用できない文字が含まれてる可能性があります。半角英数字とアンダースコアのみ使用可能です。`,
          DiagnosticSeverity.Warning,
        ),
      );
    }
  }
}

function checkMissingScenariosAndLabels(
  infoWs: any,
  parser: any,
  parsedData: any[],
  projectPath: string,
  filePath: string,
  scenarioDocument: TextDocument,
  diagnostics: Diagnostic[],
  tyranoBuilderEnabled: boolean,
): void {
  for (const data of parsedData) {
    if (
      data["name"] === "comment" ||
      data["name"] === "text" ||
      data["name"] === "label"
    )
      continue;

    // storage check
    if (data["pm"]["storage"] !== undefined) {
      const range = getParameterRange(
        "storage",
        data["pm"]["storage"],
        data,
        scenarioDocument,
      );
      if (isExistPercentAtBeginning(data["pm"]["storage"])) continue;
      if (isValueIsIncludeVariable(data["pm"]["storage"])) {
        if (!isExistAmpersandAtBeginning(data["pm"]["storage"])) {
          diagnostics.push(
            Diagnostic.create(
              range,
              "パラメータに変数を使う場合は先頭に'&'が必要です。",
              DiagnosticSeverity.Error,
            ),
          );
          continue;
        }
      } else {
        if (
          !fs.existsSync(
            infoWs.convertToAbsolutePathFromRelativePath(
              projectPath +
                infoWs.DATA_DIRECTORY +
                infoWs.DATA_SCENARIO +
                infoWs.pathDelimiter +
                data["pm"]["storage"],
            ),
          )
        ) {
          diagnostics.push(
            Diagnostic.create(
              range,
              data["pm"]["storage"] + "は存在しないファイルです。",
              DiagnosticSeverity.Error,
            ),
          );
          continue;
        }
      }
    }

    // target check
    if (data["pm"]["target"] !== undefined) {
      const range = getParameterRange(
        "target",
        data["pm"]["target"],
        data,
        scenarioDocument,
      );
      if (isExistPercentAtBeginning(data["pm"]["target"])) continue;
      if (isValueIsIncludeVariable(data["pm"]["target"])) {
        if (!isExistAmpersandAtBeginning(data["pm"]["target"])) {
          diagnostics.push(
            Diagnostic.create(
              range,
              "パラメータに変数を使う場合は先頭に'&'が必要です。",
              DiagnosticSeverity.Error,
            ),
          );
          continue;
        }
      } else if (!isValueIsIncludeVariable(data["pm"]["storage"])) {
        data["pm"]["target"] = data["pm"]["target"].replace("*", "");
        const storageFsPath =
          data["pm"]["storage"] === undefined
            ? filePath
            : infoWs.convertToAbsolutePathFromRelativePath(
                projectPath +
                  infoWs.DATA_DIRECTORY +
                  infoWs.DATA_SCENARIO +
                  infoWs.pathDelimiter +
                  data["pm"]["storage"],
              );

        const storageDoc = infoWs.scenarioFileMap.get(storageFsPath);
        if (!storageDoc) {
          diagnostics.push(
            Diagnostic.create(
              range,
              data["pm"]["target"] +
                "ファイル解析中に下線の箇所でエラーが発生しました。開発者への報告をお願いします。",
              DiagnosticSeverity.Error,
            ),
          );
          continue;
        }
        const storageParsedData = parser.parseText(storageDoc.getText());
        let isLabelExist = false;
        for (const storageData of storageParsedData) {
          if (storageData["pm"]["label_name"] === data["pm"]["target"]) {
            isLabelExist = true;
            break;
          }
        }
        if (
          !isLabelExist &&
          !(tyranoBuilderEnabled && data["pm"]["target"] === "")
        ) {
          diagnostics.push(
            Diagnostic.create(
              range,
              data["pm"]["target"] + "は存在しないラベルです。",
              DiagnosticSeverity.Error,
            ),
          );
        }
      }
    }
  }
}

function checkJumpAndCallInIfStatement(
  parsedData: any[],
  doc: TextDocument,
  diagnostics: Diagnostic[],
): void {
  let isInIf = false;
  for (const data of parsedData) {
    if (data["name"] === "comment") continue;
    if (data["name"] === "if") isInIf = true;
    if (data["name"] === "endif") isInIf = false;

    if (isInIf && (data["name"] === "jump" || data["name"] === "call")) {
      const lineText = getLineText(doc, data["line"]);
      const tagFirstIndex = lineText.indexOf(data["name"]);
      const tagLastIndex = tagFirstIndex + sumStringLengthsInObject(data["pm"]);
      const range = Range.create(
        data["line"],
        tagFirstIndex,
        data["line"],
        tagLastIndex,
      );
      diagnostics.push(
        Diagnostic.create(
          range,
          `ifの中での${data["name"]}は正常に動作しない可能性があります。[${data["name"]} cond="条件式"]に置き換えることを推奨します。`,
          DiagnosticSeverity.Warning,
        ),
      );
    }
  }
}

function checkMacroDuplicate(
  infoWs: any,
  projectPath: string,
  filePath: string,
  diagnostics: Diagnostic[],
): void {
  const defineMacroMap = infoWs.defineMacroMap.get(projectPath);
  if (!defineMacroMap) return;

  const allMacros = Array.from(defineMacroMap.values()) as any[];
  const macroNameCounts: Record<string, number> = {};
  for (const item of allMacros) {
    macroNameCounts[item.macroName] =
      (macroNameCounts[item.macroName] || 0) + 1;
  }
  const duplicateMacroNames = Object.keys(macroNameCounts).filter(
    (name) => macroNameCounts[name] > 1,
  );
  const duplicatesInFile = allMacros.filter(
    (m: any) =>
      duplicateMacroNames.includes(m.macroName) &&
      m.location &&
      URI.parse(m.location.uri).fsPath === filePath,
  );

  for (const macro of duplicatesInFile) {
    if (macro.location) {
      const end = Position.create(
        macro.location.range.start.line,
        macro.location.range.end.character +
          macro.macroName.length +
          `macro name="${macro.macroName}"`.length,
      );
      const range = Range.create(macro.location.range.start, end);
      diagnostics.push(
        Diagnostic.create(
          range,
          `マクロ名 "${macro.macroName}" が重複しています。同じ名前のマクロが他の箇所で定義されています。`,
          DiagnosticSeverity.Warning,
        ),
      );
    }
  }
}

function checkParameterSpacing(
  doc: TextDocument,
  diagnostics: Diagnostic[],
): void {
  const text = doc.getText();
  const lines = text.split("\n");

  for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
    const line = lines[lineNumber];
    const missingSpacePatterns = [
      /"([a-zA-Z_][a-zA-Z0-9_]*\s*=)/g,
      /'([a-zA-Z_][a-zA-Z0-9_]*\s*=)/g,
      /`([a-zA-Z_][a-zA-Z0-9_]*\s*=)/g,
    ];

    for (const pattern of missingSpacePatterns) {
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const paramName = match[1].replace(/\s*=/, "");
        const errorStartIndex = match.index;
        const range = Range.create(
          lineNumber,
          errorStartIndex,
          lineNumber,
          errorStartIndex + paramName.length,
        );
        diagnostics.push(
          Diagnostic.create(
            range,
            "パラメータ間に半角スペースがありません。パラメータ間は半角スペースで区切ってください。",
            DiagnosticSeverity.Error,
          ),
        );
      }
      pattern.lastIndex = 0;
    }
  }
}

function checkUndefinedParameter(
  infoWs: any,
  data: any,
  projectPath: string,
  doc: TextDocument,
  diagnostics: Diagnostic[],
  tyranoBuilderEnabled: boolean,
  tyranoBuilderSkipTags: string[],
  tyranoBuilderSkipParameters: { [tag: string]: string[] },
): void {
  const tagName = data["name"];
  if (tyranoBuilderEnabled && tyranoBuilderSkipTags.includes(tagName)) return;

  const tagParameters = data["pm"];
  if (!tagParameters || typeof tagParameters !== "object") return;

  const suggestions = infoWs.suggestions.get(projectPath);
  if (!suggestions || !(suggestions as any)[tagName]) return;

  const tagDefinition = (suggestions as any)[tagName];
  if (!tagDefinition.parameters || !Array.isArray(tagDefinition.parameters))
    return;

  const validParameterNames = tagDefinition.parameters.map(
    (param: any) => param.name,
  );
  validParameterNames.push("cond");

  let charaName = "";
  if (tagName === "chara_part") {
    charaName = data["pm"]["name"];
    const characterDataArray = infoWs.characterMap
      .get(projectPath)
      ?.filter((cd: any) => cd.name === charaName);
    if (characterDataArray) {
      const layerKeys = new Set<string>();
      for (const characterData of characterDataArray) {
        for (const [, partDataArray] of characterData.layer) {
          for (const partData of partDataArray) {
            layerKeys.add(partData.part);
          }
        }
      }
      validParameterNames.push(...layerKeys);
    }
  }

  for (const paramName in tagParameters) {
    if (paramName === "*") continue;
    if (!validParameterNames.includes(paramName)) {
      if (
        tyranoBuilderEnabled &&
        tyranoBuilderSkipParameters[tagName]?.includes(paramName)
      )
        continue;
      const range = getParameterRange(
        paramName,
        tagParameters[paramName],
        data,
        doc,
      );

      if (tagName === "chara_part") {
        diagnostics.push(
          Diagnostic.create(
            range,
            `タグ[${tagName}]のキャラ${charaName}には"${paramName}"パラメータが存在しません。chara_showやchara_layerタグを見直してください。`,
            DiagnosticSeverity.Error,
          ),
        );
      } else {
        diagnostics.push(
          Diagnostic.create(
            range,
            `タグ[${tagName}]のパラメータ "${paramName}" はタグ "${tagName}" に定義されていません。`,
            DiagnosticSeverity.Error,
          ),
        );
      }
    }
  }
}

function checkMissingAmpersandInVariable(
  data: any,
  doc: TextDocument,
  diagnostics: Diagnostic[],
): void {
  const tagName = data["name"];
  if (!tagName || tagName === "text" || tagName === "comment") return;

  const tagParameters = data["pm"];
  if (!tagParameters || typeof tagParameters !== "object") return;

  for (const paramName in tagParameters) {
    if (paramName === "exp" || paramName === "cond" || paramName === "preexp")
      continue;
    if (
      (tagName === "edit" && paramName === "name") ||
      (tagName === "dialog" && paramName === "name")
    )
      continue;

    const paramValue = tagParameters[paramName];
    if (typeof paramValue !== "string") continue;

    if (isValueIsIncludeVariable(paramValue)) {
      if (
        !isExistAmpersandAtBeginning(paramValue) &&
        !isExistPercentAtBeginning(paramValue)
      ) {
        const range = getParameterRange(paramName, paramValue, data, doc);
        diagnostics.push(
          Diagnostic.create(
            range,
            `タグ[${tagName}]のパラメータ"${paramName}"で変数を使用する場合は値の先頭に&、もしくはマクロで渡された変数なら%を付ける必要があります。例: ${paramName}="&${paramValue}"`,
            DiagnosticSeverity.Warning,
          ),
        );
      }
    }
  }
}

// ── Diagnostic helpers ──

function isExistAmpersandAtBeginning(value: string): boolean {
  return value.indexOf("&") === 0;
}

function isExistPercentAtBeginning(value: string): boolean {
  return value.indexOf("%") === 0;
}

function isValueIsIncludeVariable(value: string): boolean {
  if (value === undefined) return false;
  return !!(
    value.match(/f\.[a-zA-Z_]\w*/) ||
    value.match(/sf\.[a-zA-Z_]\w*/) ||
    value.match(/tf\.[a-zA-Z_]\w*/) ||
    value.match(/mp\.[a-zA-Z_]\w*/)
  );
}

function sumStringLengthsInObject(obj: object): number {
  let totalLength = 0;
  const value = 4;
  const firstValue = 2;
  totalLength += firstValue;
  for (const key in obj) {
    if (typeof key === "string") totalLength += key.length;
    if (typeof (obj as any)[key] === "string")
      totalLength += (obj as any)[key].length;
    totalLength += value;
  }
  return totalLength;
}

function getParameterRange(
  paramName: string,
  _paramValue: string,
  data: any,
  document: TextDocument,
): Range {
  try {
    const lineText = getLineText(document, data["line"]);
    const escapedParamName = escapeRegExp(paramName);
    const patterns = [
      new RegExp(`\\b${escapedParamName}\\s*=\\s*"[^"]*"`),
      new RegExp(`\\b${escapedParamName}\\s*=\\s*'[^']*'`),
      new RegExp(`\\b${escapedParamName}\\s*=\\s*[^\\s\\]]+`),
    ];

    for (const pattern of patterns) {
      const match = lineText.match(pattern);
      if (match && match.index !== undefined) {
        return Range.create(
          data["line"],
          match.index,
          data["line"],
          match.index + match[0].length,
        );
      }
    }

    // Fallback: whole line
    const firstNonWhitespace = lineText.length - lineText.trimStart().length;
    return Range.create(
      data["line"],
      firstNonWhitespace,
      data["line"],
      lineText.length,
    );
  } catch {
    return Range.create(data["line"], 1, data["line"], 2);
  }
}
