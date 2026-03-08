import { Position } from "vscode-languageserver/node";
/* eslint-disable no-var */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * サーバー側パーサークラス。
 * vscode APIに依存しない。Position は vscode-languageserver の型を使用。
 */
export class Parser {
  private static instance: Parser = new Parser();
  private constructor() {}
  public static getInstance(): Parser {
    return this.instance;
  }

  public getIndex(parsedData: any, character: number): number {
    let ret: number = -1;
    for (const [index, data] of parsedData.entries()) {
      if (data["column"] > character) {
        return ret;
      }
      ret = index;
    }
    return ret;
  }

  public parseText(text: string): any {
    return this.parseScenario(text)["array_s"];
  }

  public getNearestLabel(
    parsedData: any,
    cursor: Position | undefined,
  ): string {
    if (!cursor || !parsedData) {
      return "";
    }
    const filteredData = parsedData.filter(
      (item: any) => item.name === "label" && item.pm.line < cursor.line,
    );
    if (filteredData.length > 0) {
      return filteredData[filteredData.length - 1].pm.label_name;
    }
    return "";
  }

  //----------------------------------------------
  // 以下、移植したパーサー処理
  //----------------------------------------------
  private flag_script = false;
  private parseScenario(text_str: string): any {
    var array_s = [];
    var column = -1;
    var map_label = {};
    var array_row = text_str.split("\n");
    var flag_comment = false;
    this.flag_script = false;
    for (var i = 0; i < array_row.length; i++) {
      var line_str = array_row[i].trim();
      var first_char = line_str.substr(0, 1);

      if (line_str.indexOf("endscript") != -1) {
        this.flag_script = false;
      }

      if (flag_comment === true && line_str === "*/") {
        flag_comment = false;
      } else if (line_str === "/*" || line_str.startsWith("/**")) {
        flag_comment = true;
      } else if (first_char === "#") {
        var tmp_line = line_str.replace("#", "").trim();
        var chara_name = "";
        var chara_face = "";
        if (tmp_line.split(":").length > 1) {
          var array_line = tmp_line.split(":");
          chara_name = array_line[0];
          chara_face = array_line[1];
        } else {
          chara_name = tmp_line;
        }
        const text_obj = {
          line: i,
          name: "chara_ptext",
          pm: { name: chara_name, face: chara_face },
          val: "text",
        };
        array_s.push(text_obj);
      } else if (first_char === "*") {
        var label_tmp = line_str.substr(1, line_str.length).split("|");
        var label_key = "";
        var label_val = "";
        label_key = label_tmp[0].trim();
        if (label_tmp.length > 1) {
          label_val = label_tmp[1].trim();
        }
        var label_obj: any = {
          name: "label",
          pm: {
            line: i,
            column: 0,
            index: array_s.length,
            label_name: label_key,
            val: label_val,
            is_in_comment: flag_comment,
          },
          val: label_val,
        };
        array_s.push(label_obj);
        if (map_label[label_obj.pm.label_name]) {
          // duplicate label
        } else {
          map_label[label_obj.pm.label_name] = label_obj.pm;
        }
      } else if (first_char === "@") {
        var tag_str = line_str.substr(1, line_str.length);
        var tmpobj = this.makeTag(tag_str, i, 0, flag_comment, first_char);
        array_s.push(tmpobj);
      } else {
        if (first_char === "_") {
          line_str = line_str.substring(1, line_str.length);
        }
        var array_char = line_str.split("");
        var text = "";
        var tag_str = "";
        var flag_tag = false;
        var num_kakko = 0;
        for (var j = 0; j < array_char.length; j++) {
          var c = array_char[j];
          if (flag_tag === true) {
            if (c === "]" && this.flag_script == false && first_char !== ";") {
              num_kakko--;
              if (num_kakko == 0) {
                flag_tag = false;
                array_s.push(
                  this.makeTag(tag_str, i, column, flag_comment, first_char),
                );
                tag_str = "";
              } else {
                tag_str += c;
              }
            } else if (c === "[" && this.flag_script == false && first_char !== ";") {
              num_kakko++;
              tag_str += c;
            } else {
              tag_str += c;
            }
          } else if (
            flag_tag === false &&
            c === "[" &&
            this.flag_script == false &&
            first_char !== ";"
          ) {
            num_kakko++;
            column = j;
            column += Math.abs(
              array_row[i].trim().length - array_row[i].length,
            );
            if (text != "") {
              const text_obj = {
                line: i,
                column: column - text.length,
                name: "text",
                pm: { val: text },
                val: text,
              };
              array_s.push(text_obj);
              text = "";
            }
            flag_tag = true;
          } else {
            text += c;
          }
        }
        if (text != "") {
          var nameParam = "text";
          if (flag_comment == true || first_char === ";") {
            nameParam = "comment";
          }
          var text_obj = {
            line: i,
            column: column - text.length,
            name: nameParam,
            pm: { val: text },
            val: text,
          };
          array_s.push(text_obj);
        }
      }
    }
    var result_obj = {
      array_s: array_s,
      map_label: map_label,
    };
    return result_obj;
  }

  private makeTag(
    str: any,
    line: any,
    column: any,
    flag_comment: any,
    first_char: any,
  ): any {
    var obj = {
      line: line,
      column: column,
      name: "",
      pm: {},
      val: "",
    };
    var array_c = str.split("");
    var flag_quot_c = "";
    var tmp_str = "";
    var cnt_quot_c = 0;
    for (var j = 0; j < array_c.length; j++) {
      var c = array_c[j];
      if (flag_quot_c == "" && (c === '"' || c === "'")) {
        flag_quot_c = c;
        cnt_quot_c = 0;
      } else {
        if (flag_quot_c != "") {
          if (c === flag_quot_c) {
            flag_quot_c = "";
            if (cnt_quot_c == 0) {
              tmp_str += "undefined";
            }
            cnt_quot_c = 0;
          } else {
            if (c == "=") {
              c = "#";
            }
            if (c == " ") {
              c = "";
            }
            tmp_str += c;
            cnt_quot_c++;
          }
        } else {
          tmp_str += c;
        }
      }
    }
    str = tmp_str;
    var array = str.split(" ");
    if (flag_comment == true || first_char === ";") {
      obj.name = "comment";
    } else {
      obj.name = array[0].trim();
    }
    for (var k = 1; k < array.length; k++) {
      if (array[k] == "") {
        array.splice(k, 1);
        k--;
      } else if (array[k] === "=") {
        if (array[k - 1]) {
          if (array[k + 1]) {
            array[k - 1] = array[k - 1] + "=" + array[k + 1];
            array.splice(k, 2);
            k--;
          }
        }
      } else if (array[k].substr(0, 1) === "=") {
        if (array[k - 1]) {
          if (array[k]) {
            array[k - 1] = array[k - 1] + array[k];
            array.splice(k, 1);
          }
        }
      } else if (
        array[k].substr(array[k].length - 1, array[k].length) === "="
      ) {
        if (array[k + 1]) {
          if (array[k]) {
            array[k] = array[k] + array[k + 1];
            array.splice(k + 1, 1);
          }
        }
      }
    }
    for (var i = 1; i < array.length; i++) {
      var tmp = array[i].trim().split("=");
      var pm_key = tmp[0];
      var pm_val = tmp[1];
      if (pm_key == "*") {
        obj.pm["*"] = "";
      }
      if (pm_val != "") {
        obj.pm[pm_key] = this.replaceAll(pm_val, "#", "=");
      }
      if (pm_val == "undefined") {
        obj.pm[pm_key] = "";
      }
    }
    if (obj.name == "iscript") {
      this.flag_script = true;
    }
    if (obj.name == "endscript") {
      this.flag_script = false;
    }
    return obj;
  }

  private replaceAll(text: any, searchString: any, replacement: any) {
    if (typeof text != "string") {
      return text;
    }
    return text.split(searchString).join(replacement);
  }
}
