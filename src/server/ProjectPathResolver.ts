import * as fs from "fs";
import * as path from "path";

/**
 * サーバー側のプロジェクトパス解決クラス。
 * vscode APIを使用せず、初期化時にワークスペースルートパスと設定を注入する。
 */
export class ProjectPathResolver {
  public pathDelimiter = process.platform === "win32" ? "\\" : "/";
  public readonly DATA_DIRECTORY: string = this.pathDelimiter + "data";
  public readonly TYRANO_DIRECTORY: string = this.pathDelimiter + "tyrano";
  public readonly DATA_BGIMAGE: string = this.pathDelimiter + "bgimage";
  public readonly DATA_BGM: string = this.pathDelimiter + "bgm";
  public readonly DATA_FGIMAGE: string = this.pathDelimiter + "fgimage";
  public readonly DATA_IMAGE: string = this.pathDelimiter + "image";
  public readonly DATA_OTHERS: string = this.pathDelimiter + "others";
  public readonly DATA_SCENARIO: string = this.pathDelimiter + "scenario";
  public readonly DATA_SOUND: string = this.pathDelimiter + "sound";
  public readonly DATA_SYSTEM: string = this.pathDelimiter + "system";
  public readonly DATA_VIDEO: string = this.pathDelimiter + "video";

  private workspaceRoot: string = "";
  private isParsePluginFolder: boolean = false;

  public initialize(workspaceRoot: string, isParsePluginFolder: boolean) {
    this.workspaceRoot = workspaceRoot;
    this.isParsePluginFolder = isParsePluginFolder;
  }

  public getWorkspaceRootPath(): string {
    return this.workspaceRoot;
  }

  public getTyranoScriptProjectRootPaths(): string[] {
    if (!this.workspaceRoot) {
      return [];
    }

    const listFiles = (dir: string): string[] => {
      try {
        return fs
          .readdirSync(dir, { withFileTypes: true })
          .flatMap((dirent) =>
            dirent.name === ".git"
              ? []
              : dirent.isFile()
                ? [`${dir}${this.pathDelimiter}${dirent.name}`]
                    .filter((_file) => dirent.name === "index.html")
                    .map((str) =>
                      str.replace(this.pathDelimiter + "index.html", ""),
                    )
                : listFiles(`${dir}${this.pathDelimiter}${dirent.name}`),
          );
      } catch (_error) {
        return [];
      }
    };

    return listFiles(this.workspaceRoot);
  }

  public getProjectPathByFilePath(filePath: string): string {
    let searchDir;
    do {
      const delimiterIndex = filePath.lastIndexOf(this.pathDelimiter);
      if (delimiterIndex === -1) {
        return "";
      }
      filePath = filePath.substring(0, delimiterIndex);
      try {
        searchDir = fs.readdirSync(filePath, "utf-8");
      } catch (_error) {
        return "";
      }
    } while (searchDir.filter((e) => e === "index.html").length <= 0);
    return filePath;
  }

  public getProjectFiles(
    projectRootPath: string,
    permissionExtension: string[] = [],
    isAbsolute: boolean = false,
  ): string[] {
    if (
      projectRootPath === undefined ||
      projectRootPath === "" ||
      !fs.existsSync(projectRootPath)
    ) {
      return [];
    }

    let ret = this.listFilesRecursively(projectRootPath, permissionExtension);

    if (!isAbsolute) {
      ret = ret.map((e) => {
        return e.replace(projectRootPath + this.pathDelimiter, "");
      });
    }

    return ret;
  }

  private listFilesRecursively(
    dir: string,
    permissionExtension: string[],
  ): string[] {
    const results: string[] = [];
    const stack = [dir];

    while (stack.length > 0) {
      const currentDir = stack.pop()!;
      try {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        for (const entry of entries) {
          this.collectFileEntry(
            entry,
            currentDir,
            stack,
            results,
            permissionExtension,
          );
        }
      } catch (_error) {
        // ディレクトリアクセスに失敗した場合はスキップ
      }
    }
    return results;
  }

  private collectFileEntry(
    entry: fs.Dirent,
    currentDir: string,
    stack: string[],
    results: string[],
    permissionExtension: string[],
  ): void {
    if (entry.name === ".git") return;
    const fullPath = `${currentDir}${this.pathDelimiter}${entry.name}`;
    if (entry.isDirectory()) {
      stack.push(fullPath);
    } else if (
      entry.isFile() &&
      (permissionExtension.length === 0 ||
        permissionExtension.includes(path.extname(fullPath)))
    ) {
      results.push(fullPath);
    }
  }

  public isSamePath(path1: string, path2: string) {
    if (path1 === undefined || path2 === undefined) {
      return false;
    }
    return path.resolve(path1) === path.resolve(path2);
  }

  public convertToAbsolutePathFromRelativePath(relativePath: string): string {
    return path.resolve(relativePath);
  }

  public isSkipParse(filePath: string, directory: string): boolean {
    if (this.isParsePluginFolder) {
      return false;
    }
    const pluginFolder = path.resolve(directory + "/data/others/plugin");
    const normalizedFilePath = path.resolve(filePath);
    const normalizedFolderPath = path.resolve(pluginFolder);
    return normalizedFilePath.startsWith(normalizedFolderPath + path.sep);
  }
}
