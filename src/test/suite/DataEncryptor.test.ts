import * as assert from "assert";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import { DataEncryptor } from "../../subscriptions/exportExe/DataEncryptor";

suite("DataEncryptor", () => {
  vscode.window.showInformationMessage("Start DataEncryptor tests.");

  suite("generateKey", () => {
    test("正常系 32バイトの鍵を生成する", () => {
      const key = DataEncryptor.generateKey();
      assert.strictEqual(key.length, 32);
    });

    test("正常系 毎回異なる鍵を生成する", () => {
      const a = DataEncryptor.generateKey();
      const b = DataEncryptor.generateKey();
      assert.notStrictEqual(a.toString("hex"), b.toString("hex"));
    });
  });

  suite("encryptFile / decryptFile", () => {
    test("正常系 テキストのラウンドトリップで元に戻る", () => {
      const key = DataEncryptor.generateKey();
      const plain = Buffer.from("[bg storage=\"test.png\"]\nこんにちは[p]", "utf8");
      const encrypted = DataEncryptor.encryptFile(plain, key);
      const decrypted = DataEncryptor.decryptFile(encrypted, key);
      assert.ok(decrypted.equals(plain));
    });

    test("正常系 バイナリのラウンドトリップで元に戻る", () => {
      const key = DataEncryptor.generateKey();
      const plain = Buffer.from([0x00, 0xff, 0x10, 0x89, 0x50, 0x4e, 0x47]);
      const encrypted = DataEncryptor.encryptFile(plain, key);
      const decrypted = DataEncryptor.decryptFile(encrypted, key);
      assert.ok(decrypted.equals(plain));
    });

    test("正常系 暗号文の先頭16バイトがIV、暗号文は平文と異なる", () => {
      const key = DataEncryptor.generateKey();
      const plain = Buffer.from("hello world hello world", "utf8");
      const encrypted = DataEncryptor.encryptFile(plain, key);
      // IV(16) + ciphertext のため平文より長い
      assert.ok(encrypted.length > plain.length);
      // 平文がそのまま含まれていないこと
      assert.ok(!encrypted.includes(plain));
    });

    test("正常系 同じ入力でもIVが異なるため暗号文が変わる", () => {
      const key = DataEncryptor.generateKey();
      const plain = Buffer.from("same input", "utf8");
      const a = DataEncryptor.encryptFile(plain, key);
      const b = DataEncryptor.encryptFile(plain, key);
      assert.ok(!a.equals(b));
      // ただし復号すれば双方とも同じ平文になる
      assert.ok(DataEncryptor.decryptFile(a, key).equals(plain));
      assert.ok(DataEncryptor.decryptFile(b, key).equals(plain));
    });
  });

  suite("encryptDirectory", () => {
    let tmpDir: string;

    setup(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tyrano-enc-test-"));
    });

    teardown(() => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    test("正常系 配下を暗号化し、鍵で復号すると元に戻る。除外フォルダは変更されない", () => {
      // data/scenario/first.ks, data/image/a.png, data/video/movie.mp4 を用意
      const dataDir = path.join(tmpDir, "data");
      const ksPath = path.join(dataDir, "scenario", "first.ks");
      const imgPath = path.join(dataDir, "image", "a.png");
      const videoPath = path.join(dataDir, "video", "movie.mp4");
      fs.mkdirSync(path.dirname(ksPath), { recursive: true });
      fs.mkdirSync(path.dirname(imgPath), { recursive: true });
      fs.mkdirSync(path.dirname(videoPath), { recursive: true });

      const ksContent = Buffer.from("*start\n[bg storage=\"a.png\"]\n", "utf8");
      const imgContent = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
      const videoContent = Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74]);
      fs.writeFileSync(ksPath, ksContent);
      fs.writeFileSync(imgPath, imgContent);
      fs.writeFileSync(videoPath, videoContent);

      const key = DataEncryptor.generateKey();
      const count = DataEncryptor.encryptDirectory(dataDir, key, ["video"]);

      // 暗号化されたのは ks と png の2件（video は除外）
      assert.strictEqual(count, 2);

      // ks: ディスク上は暗号化済み（元の内容と異なる）が、復号すると元に戻る
      const ksOnDisk = fs.readFileSync(ksPath);
      assert.ok(!ksOnDisk.equals(ksContent));
      assert.ok(DataEncryptor.decryptFile(ksOnDisk, key).equals(ksContent));

      // png も同様
      const imgOnDisk = fs.readFileSync(imgPath);
      assert.ok(!imgOnDisk.equals(imgContent));
      assert.ok(DataEncryptor.decryptFile(imgOnDisk, key).equals(imgContent));

      // video は除外されているのでバイト不変
      const videoOnDisk = fs.readFileSync(videoPath);
      assert.ok(videoOnDisk.equals(videoContent));
    });

    test("正常系 存在しないディレクトリでは0件を返す", () => {
      const key = DataEncryptor.generateKey();
      const count = DataEncryptor.encryptDirectory(
        path.join(tmpDir, "nonexistent"),
        key,
      );
      assert.strictEqual(count, 0);
    });
  });
});
