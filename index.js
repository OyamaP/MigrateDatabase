const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const tables = require("./tables.json");
require("dotenv").config();

/**
 * define
 */
const IS_DEBUG = process.env.IS_DEBUG === "true" ? true : false;
const TG_DB_HOST = process.env.TG_DB_HOST;
const TG_DB_NAME = process.env.TG_DB_NAME;
const TG_DB_USER = process.env.TG_DB_USER;
const TG_DB_PASSWORD = process.env.TG_DB_PASSWORD;
const START_DATE = process.env.START_DATE;
const END_DATE = process.env.END_DATE;
const USE_DIR = process.env.USE_DIR;
const IS_DELETE_FILE = process.env.IS_DELETE_FILE === "true" ? true : false;
const MG_DB_HOST = process.env.MG_DB_HOST;
const MG_DB_NAME = process.env.MG_DB_NAME;
const MG_DB_USER = process.env.MG_DB_USER;
const MG_DB_PASSWORD = process.env.MG_DB_PASSWORD;

/**
 * DBから指定したテーブルを抽出
 * @param {object}
 */
const dump = (object) => {
  const target = generateTarget(object);
  const filename = `${USE_DIR}${TG_DB_NAME}_${object.tableName}.sql`;
  const sql = `mysqldump --host=${TG_DB_HOST} --user=${TG_DB_USER} --password=${TG_DB_PASSWORD} ${target} > ${filename}`;
  console.log(sql);
  if (!IS_DEBUG) execSync(sql);
};

/**
 * ターゲット生成
 * DB名 + テーブル名 + whereオプション
 * @param {object}
 * @return {string}
 */
const generateTarget = (object) => {
  return `${TG_DB_NAME} ${object.tableName}${addFilter(object)}`;
};

/**
 * ダンプ用のフィルタクエリを追加
 * filter 設定されていない場合は空白文字をreturn
 * @param {object}
 * @return {string}
 */
const addFilter = (object) => {
  if (
    !object.hasOwnProperty("filter") ||
    !["type", "column"].every((key) => object.filter.hasOwnProperty(key))
  )
    return "";
  // 任意カラムの日付データを期間で絞り込む
  const isSetDate = Boolean(START_DATE) && Boolean(END_DATE);
  if (isSetDate && object.filter.type === "between.date")
    return ` --where "'${START_DATE}' < ${object.filter.column} and ${object.filter.column} < '${END_DATE}'"`;
  return "";
};

/**
 * SQLファイルのパスを取得
 * @return {string[]}
 */
const getFilePaths = () => {
  return fs
    .readdirSync(USE_DIR)
    .filter((filename) => path.extname(filename) === ".sql")
    .map((filename) => `${USE_DIR}${filename}`);
};

/**
 * 移行先のDBにインポートした後にsqlファイルを削除
 * @param {string}
 */
const importDB = (filePath) => {
  const sql = `mysql --host=${MG_DB_HOST} --user=${MG_DB_USER} --password=${MG_DB_PASSWORD} ${MG_DB_NAME} < ${filePath}`;
  console.log(sql);
  if (!IS_DEBUG) execSync(sql);
  if (IS_DELETE_FILE) fs.unlinkSync(filePath);
};

/**
 * run
 */
console.log(`===== Migrate Start => Debug Mode: ${IS_DEBUG} =====`);
try {
  tables.data.forEach((object) => dump(object)); // エクスポート
  getFilePaths().forEach((filePath) => importDB(filePath)); // インポート
} catch (err) {
  console.log(err);
}
console.log(`===== Migrate End =====`);
