import * as assert from "assert";
import { isNestedPropertyAccess } from "../../embeddedJavaScriptSupport";

suite("isNestedPropertyAccess", () => {
  // ── ネストされたプロパティアクセス (true を返すケース) ──

  test("f.testObj. → true", () => {
    assert.strictEqual(isNestedPropertyAccess("f.testObj.", 10), true);
  });

  test("sf.config.value. → true", () => {
    assert.strictEqual(isNestedPropertyAccess("sf.config.value.", 16), true);
  });

  test("tf.obj.sub. → true", () => {
    assert.strictEqual(isNestedPropertyAccess("tf.obj.sub.", 11), true);
  });

  test("mp.param.name. → true", () => {
    assert.strictEqual(isNestedPropertyAccess("mp.param.name.", 14), true);
  });

  test("f.obj.nested.deep. → true (3段以上のチェーン)", () => {
    assert.strictEqual(
      isNestedPropertyAccess("f.obj.nested.deep.", 18),
      true,
    );
  });

  test("f.testObj.fu → true (入力途中)", () => {
    assert.strictEqual(isNestedPropertyAccess("f.testObj.fu", 12), true);
  });

  test("代入の右辺: let x = f.testObj. → true", () => {
    assert.strictEqual(
      isNestedPropertyAccess("let x = f.testObj.", 18),
      true,
    );
  });

  test("条件式内: if (f.testObj. → true", () => {
    assert.strictEqual(
      isNestedPropertyAccess("if (f.testObj.", 14),
      true,
    );
  });

  test("インデント付き:   f.testObj. → true", () => {
    assert.strictEqual(isNestedPropertyAccess("  f.testObj.", 12), true);
  });

  test("f.testObj.$special. → true ($ を含む変数名)", () => {
    assert.strictEqual(
      isNestedPropertyAccess("f.testObj.$special.", 19),
      true,
    );
  });

  // ── 1段階のプロパティアクセス (false を返すケース) ──

  test("f. → false (1段階のアクセス)", () => {
    assert.strictEqual(isNestedPropertyAccess("f.", 2), false);
  });

  test("sf. → false", () => {
    assert.strictEqual(isNestedPropertyAccess("sf.", 3), false);
  });

  test("tf. → false", () => {
    assert.strictEqual(isNestedPropertyAccess("tf.", 3), false);
  });

  test("mp. → false", () => {
    assert.strictEqual(isNestedPropertyAccess("mp.", 3), false);
  });

  test("let x = f. → false", () => {
    assert.strictEqual(isNestedPropertyAccess("let x = f.", 10), false);
  });

  test("f.hoge → false (ドットの後に入力途中、1段目)", () => {
    assert.strictEqual(isNestedPropertyAccess("f.hoge", 6), false);
  });

  // ── TyranoScript プレフィックス以外 (false を返すケース) ──

  test("obj. → false (TyranoScript プレフィックスでない)", () => {
    assert.strictEqual(isNestedPropertyAccess("obj.", 4), false);
  });

  test("obj.sub. → false (TyranoScript プレフィックスでない)", () => {
    assert.strictEqual(isNestedPropertyAccess("obj.sub.", 8), false);
  });

  test("console.log. → false", () => {
    assert.strictEqual(isNestedPropertyAccess("console.log.", 12), false);
  });

  // ── エッジケース ──

  test("空文字列 → false", () => {
    assert.strictEqual(isNestedPropertyAccess("", 0), false);
  });

  test("f → false (ドットなし)", () => {
    assert.strictEqual(isNestedPropertyAccess("f", 1), false);
  });

  test("カーソルが途中: 'f.testObj.hoge = 1' の位置10 → true", () => {
    // 'f.testObj.' までの位置
    assert.strictEqual(
      isNestedPropertyAccess("f.testObj.hoge = 1", 10),
      true,
    );
  });

  test("カーソルが途中: 'f.testObj.hoge = 1' の位置14 → true", () => {
    // 'f.testObj.hoge' までの位置
    assert.strictEqual(
      isNestedPropertyAccess("f.testObj.hoge = 1", 14),
      true,
    );
  });

  test("xf.testObj. → false (プレフィックスが単語の一部)", () => {
    assert.strictEqual(isNestedPropertyAccess("xf.testObj.", 11), false);
  });
});
