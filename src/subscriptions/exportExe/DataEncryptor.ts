import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

/**
 * data/ フォルダのアセットを AES-256-CBC で暗号化するユーティリティ。
 *
 * on-disk 形式は [IV(16バイト)][ciphertext]。
 * 復号は Electron の main プロセス（electron-template/main.js.template）が
 * 同じアルゴリズム・鍵で実行時に行う。
 *
 * 副作用のない純粋関数で構成し、単体テスト可能にしている。
 */
export class DataEncryptor {
  private static readonly ALGORITHM = "aes-256-cbc";
  private static readonly IV_LENGTH = 16;
  private static readonly KEY_LENGTH = 32;

  /**
   * ビルドごとにランダムな 32 バイト鍵を生成する。
   */
  public static generateKey(): Buffer {
    return crypto.randomBytes(DataEncryptor.KEY_LENGTH);
  }

  /**
   * 平文バッファを暗号化し、[IV][ciphertext] を返す。
   */
  public static encryptFile(plain: Buffer, key: Buffer): Buffer {
    const iv = crypto.randomBytes(DataEncryptor.IV_LENGTH);
    const cipher = crypto.createCipheriv(DataEncryptor.ALGORITHM, key, iv);
    const ciphertext = Buffer.concat([cipher.update(plain), cipher.final()]);
    return Buffer.concat([iv, ciphertext]);
  }

  /**
   * [IV][ciphertext] を復号して平文バッファを返す。
   */
  public static decryptFile(encrypted: Buffer, key: Buffer): Buffer {
    const iv = encrypted.subarray(0, DataEncryptor.IV_LENGTH);
    const ciphertext = encrypted.subarray(DataEncryptor.IV_LENGTH);
    const decipher = crypto.createDecipheriv(
      DataEncryptor.ALGORITHM,
      key,
      iv,
    );
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  }

  /**
   * dataDir 配下を再帰的に in-place 暗号化する。
   * excludeDirs に含まれるトップレベルフォルダ名（例: "video"）はスキップする。
   * ファイル名・パスは変更しないため、エンジンの相対参照を壊さない。
   *
   * @returns 暗号化したファイル数
   */
  public static encryptDirectory(
    dataDir: string,
    key: Buffer,
    excludeDirs: string[] = [],
  ): number {
    if (!fs.existsSync(dataDir)) {
      return 0;
    }
    let count = 0;
    const stack: string[] = [dataDir];
    while (stack.length > 0) {
      const currentDir = stack.pop()!;
      let entries: fs.Dirent[];
      try {
        entries = fs.readdirSync(currentDir, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          // data/ 直下の除外フォルダのみスキップ（data/video 等）
          const rel = path.relative(dataDir, fullPath);
          const top = rel.split(path.sep)[0];
          if (excludeDirs.includes(top)) {
            continue;
          }
          stack.push(fullPath);
        } else if (entry.isFile()) {
          const plain = fs.readFileSync(fullPath);
          fs.writeFileSync(fullPath, DataEncryptor.encryptFile(plain, key));
          count++;
        }
      }
    }
    return count;
  }
}
