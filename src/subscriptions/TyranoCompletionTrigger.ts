export const AUTO_COMPLETION_SETTING =
  "TyranoScript syntax.completion.autoTrigger";

const TAG_NAME_TRIGGER_CHARACTERS = [
  ..."abcdefghijklmnopqrstuvwxyz",
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  ..."0123456789",
  "_",
] as const;

export const AUTO_COMPLETION_TRIGGER_CHARACTERS = [
  ...TAG_NAME_TRIGGER_CHARACTERS,
  ".",
  "[",
  "@",
  "#",
  "*",
  " ",
  '"',
] as const;

export function getCompletionTriggerCharacters(
  autoTriggerEnabled: boolean,
): string[] {
  return autoTriggerEnabled ? [...AUTO_COMPLETION_TRIGGER_CHARACTERS] : [];
}

/**
 * 自動補完では、本文の入力を妨げないTyranoScript固有の文脈だけを対象にする。
 * Ctrl+Spaceによる手動補完ではこの判定を行わない。
 */
export function shouldTriggerCompletionAutomatically(
  linePrefix: string,
  triggerCharacter: string | undefined,
): boolean {
  const lastOpenBracket = linePrefix.lastIndexOf("[");
  const lastCloseBracket = linePrefix.lastIndexOf("]");
  const isInsideBracketTag = lastOpenBracket > lastCloseBracket;
  const isInsideAtTag = /^\s*@/.test(linePrefix);
  const isInsideTag = isInsideBracketTag || isInsideAtTag;

  
  switch (triggerCharacter) {
    case "[":
      return true;
    case "@":
      return /^\s*@$/.test(linePrefix);
    case "#":
      return /^\s*#$/.test(linePrefix);
    case "*":
      return /^\s*\*$/.test(linePrefix);
    case " ":
    case '"':
      return isInsideTag;
    case ".":
      return /(?:^|[^\w])&?(?:f|sf|tf|mp)(?:\.[^\s.[\]"=]*)*\.$/.test(
        linePrefix,
      );
    default:
      return (
        triggerCharacter !== undefined &&
        TAG_NAME_TRIGGER_CHARACTERS.includes(
          triggerCharacter as (typeof TAG_NAME_TRIGGER_CHARACTERS)[number],
        ) &&
        /^\s*[A-Za-z0-9_]+$/.test(linePrefix)
      );
  }
}
