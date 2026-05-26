import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import * as vscode from "vscode";
import { TyranoDataPackager } from "../../../subscriptions/TyranoDataPackager";

/**
 * decryptor.js が data.pak を読む手順を Node のみで再現する。
 * 「コマンドの pak 構築」と「実行時(レンダラー)の範囲復号」が round-trip することを検証する。
 *   [ magic 4B = "TYPK" ][ version 1B ][ salt 16B ][ indexIv 16B ][ indexLen 4B(LE) ]
 *   [ 暗号化索引(JSON) ][ DATAセクション ]。各 blob = [ iv 16B ][ ciphertext ]。
 */
function runtimeReadFromPak(
  pak: Buffer,
  key: Buffer,
  rel: string,
): Buffer | undefined {
  const PAK_MAGIC = Buffer.from("TYPK");
  if (pak.length < 41 || !pak.subarray(0, 4).equals(PAK_MAGIC) || pak[4] !== 1) {
    return undefined;
  }
  const indexIv = pak.subarray(21, 37);
  const indexLen = pak.readUInt32LE(37);
  const encIndex = pak.subarray(41, 41 + indexLen);
  const di = crypto.createDecipheriv("aes-256-cbc", key, indexIv);
  const index = JSON.parse(
    Buffer.concat([di.update(encIndex), di.final()]).toString("utf8"),
  );
  const dataStart = 41 + indexLen;
  const ent = index[rel];
  if (!ent) {
    return undefined;
  }
  const blob = pak.subarray(dataStart + ent.o, dataStart + ent.o + ent.l);
  const iv = blob.subarray(0, 16);
  const ct = blob.subarray(16);
  const d = crypto.createDecipheriv("aes-256-cbc", key, iv);
  return Buffer.concat([d.update(ct), d.final()]);
}

suite("TyranoDataPackager", () => {
  vscode.window.showInformationMessage("Start TyranoDataPackager tests.");

  const salt = Buffer.from("0123456789abcdef0123456789abcdef", "hex");
  const key = TyranoDataPackager.deriveKey("p@ssphrase-テスト", salt);

  suite("encryptBlob / decryptBlob", () => {
    test("正常系 UTF-8テキストが round-trip する", () => {
      const original = Buffer.from(
        "*start\n[bg storage=title.jpg]\nこんにちは[p]",
        "utf8",
      );
      const dec = TyranoDataPackager.decryptBlob(
        TyranoDataPackager.encryptBlob(original, key),
        key,
      );
      assert.deepStrictEqual(dec, original);
    });

    test("正常系 バイナリ(PNGシグネチャ含む)が round-trip する", () => {
      const original = Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        crypto.randomBytes(5000),
      ]);
      const dec = TyranoDataPackager.decryptBlob(
        TyranoDataPackager.encryptBlob(original, key),
        key,
      );
      assert.deepStrictEqual(dec, original);
    });

    test("異常系 鍵が異なると復号に失敗する", () => {
      const blob = TyranoDataPackager.encryptBlob(Buffer.from("secret"), key);
      const wrongKey = TyranoDataPackager.deriveKey("wrong", salt);
      assert.throws(() => {
        TyranoDataPackager.decryptBlob(blob, wrongKey);
      });
    });
  });

  suite("buildPak / 索引", () => {
    const entries = [
      { key: "scenario/first.ks", data: Buffer.from("*start\n[s]", "utf8") },
      { key: "bgimage/title.jpg", data: crypto.randomBytes(3000) },
      { key: "bgm/music.ogg", data: crypto.randomBytes(1500) },
    ];
    const pak = TyranoDataPackager.buildPak(entries, key, salt);

    test("正常系 ヘッダのマジックとsaltが取り出せる", () => {
      assert.strictEqual(pak.subarray(0, 4).toString("latin1"), "TYPK");
      assert.deepStrictEqual(TyranoDataPackager.readPakSalt(pak), salt);
    });

    test("正常系 索引が復号でき全エントリを含む", () => {
      const index = TyranoDataPackager.readPakIndex(pak, key);
      for (const e of entries) {
        assert.ok(index[e.key], `索引に ${e.key} が存在する`);
        assert.strictEqual(typeof index[e.key].o, "number");
        assert.strictEqual(typeof index[e.key].l, "number");
      }
    });

    test("正常系 各エントリが元バイトに復号できる(コマンド側API)", () => {
      const index = TyranoDataPackager.readPakIndex(pak, key);
      const dataStart = 41 + pak.readUInt32LE(37);
      for (const e of entries) {
        const { o, l } = index[e.key];
        const blob = pak.subarray(dataStart + o, dataStart + o + l);
        assert.deepStrictEqual(
          TyranoDataPackager.decryptBlob(blob, key),
          e.data,
        );
      }
    });

    test("正常系 実行時(decryptor.js)ロジックで pak から復号できる", () => {
      for (const e of entries) {
        assert.deepStrictEqual(runtimeReadFromPak(pak, key, e.key), e.data);
      }
    });

    test("異常系 鍵が異なると索引復号に失敗する", () => {
      const wrongKey = TyranoDataPackager.deriveKey("wrong", salt);
      assert.throws(() => {
        TyranoDataPackager.readPakIndex(pak, wrongKey);
      });
    });
  });

  suite("実行時(decryptor.js)との整合性", () => {
    test("正常系 decryptor.jsテンプレートが pak 方式を参照している", () => {
      const templatePath = path.resolve(
        __dirname,
        "../../../../res/runtime/decryptor.js",
      );
      const template = fs.readFileSync(templatePath, "utf8");
      assert.ok(template.includes("__INJECTED_KEY_HEX__"), "鍵注入トークン");
      assert.ok(template.includes("aes-256-cbc"), "同じアルゴリズム");
      assert.ok(template.includes('Buffer.from("TYPK")'), "同じ pak マジック");
      assert.ok(template.includes("data.pak"), "data.pak を読む");
    });
  });
});
