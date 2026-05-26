import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import * as vscode from "vscode";
import { TyranoDataPackager } from "../../../subscriptions/TyranoDataPackager";

/**
 * decryptor.js が依存する暗号化フォーマットを Node のみで再現する。
 * これにより「コマンドの暗号化」と「実行時(レンダラー)の復号」が round-trip することを検証する。
 *   [ magic 4B = "TYEN" ][ version 1B = 0x01 ][ iv 16B ][ ciphertext ... ]
 */
function runtimeDecrypt(buf: Buffer, key: Buffer): Buffer {
  const magic = Buffer.from("TYEN");
  if (
    buf.length < 21 ||
    !buf.subarray(0, 4).equals(magic) ||
    buf[4] !== 1
  ) {
    return buf;
  }
  const iv = buf.subarray(5, 21);
  const ct = buf.subarray(21);
  const d = crypto.createDecipheriv("aes-256-cbc", key, iv);
  return Buffer.concat([d.update(ct), d.final()]);
}

suite("TyranoDataPackager", () => {
  vscode.window.showInformationMessage("Start TyranoDataPackager tests.");

  const salt = Buffer.from("0123456789abcdef0123456789abcdef", "hex");
  const key = TyranoDataPackager.deriveKey("p@ssphrase-テスト", salt);

  suite("encryptBuffer / decryptBuffer", () => {
    test("正常系 UTF-8テキストが round-trip する", () => {
      const original = Buffer.from(
        "*start\n[bg storage=title.jpg]\nこんにちは[p]",
        "utf8",
      );
      const enc = TyranoDataPackager.encryptBuffer(original, key);
      const dec = TyranoDataPackager.decryptBuffer(enc, key);
      assert.deepStrictEqual(dec, original);
      assert.strictEqual(dec.toString("utf8"), original.toString("utf8"));
    });

    test("正常系 バイナリ(PNGシグネチャ含む)が round-trip する", () => {
      const original = Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        crypto.randomBytes(5000),
      ]);
      const enc = TyranoDataPackager.encryptBuffer(original, key);
      const dec = TyranoDataPackager.decryptBuffer(enc, key);
      assert.deepStrictEqual(dec, original);
    });

    test("正常系 暗号化済みバッファはコマンド側でフォーマット判定できる", () => {
      const enc = TyranoDataPackager.encryptBuffer(
        Buffer.from("data"),
        key,
      );
      assert.strictEqual(TyranoDataPackager.isEncrypted(enc), true);
      // magic "TYEN" + version 1 + iv(16) = 先頭21バイトがヘッダ
      assert.strictEqual(enc.subarray(0, 4).toString("latin1"), "TYEN");
      assert.strictEqual(enc[4], 1);
      assert.ok(enc.length >= 21);
    });

    test("正常系 平文はisEncryptedがfalseで、decryptBufferはそのまま返す", () => {
      const plain = Buffer.from("plain text, not encrypted");
      assert.strictEqual(TyranoDataPackager.isEncrypted(plain), false);
      assert.deepStrictEqual(
        TyranoDataPackager.decryptBuffer(plain, key),
        plain,
      );
    });

    test("異常系 鍵が異なると復号に失敗する", () => {
      const enc = TyranoDataPackager.encryptBuffer(
        Buffer.from("secret"),
        key,
      );
      const wrongKey = TyranoDataPackager.deriveKey("wrong", salt);
      assert.throws(() => {
        TyranoDataPackager.decryptBuffer(enc, wrongKey);
      });
    });
  });

  suite("実行時(decryptor.js)との整合性", () => {
    test("正常系 コマンドが暗号化したバッファを実行時ロジックで復号できる", () => {
      const original = crypto.randomBytes(2048);
      const enc = TyranoDataPackager.encryptBuffer(original, key);
      const dec = runtimeDecrypt(enc, key);
      assert.deepStrictEqual(dec, original);
    });

    test("正常系 decryptor.jsテンプレートが同じ方式を参照している", () => {
      const templatePath = path.resolve(
        __dirname,
        "../../../../res/runtime/decryptor.js",
      );
      const template = fs.readFileSync(templatePath, "utf8");
      assert.ok(
        template.includes("__INJECTED_KEY_HEX__"),
        "鍵注入トークンが存在する",
      );
      assert.ok(
        template.includes("aes-256-cbc"),
        "同じアルゴリズムを使用している",
      );
      assert.ok(
        template.includes('Buffer.from("TYEN")'),
        "同じマジックを使用している",
      );
    });
  });
});
