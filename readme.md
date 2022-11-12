# Migrate Database

## Why use this ?
既存プロジェクトのローカル環境構築時に適正なマイグレ設定がされておらず、運用中のDBから最新のDBをダンプしてインポートする必要があった。  
またDB内の一部テーブルは膨大なデータ(ログ)が蓄積されており、DB全体のダンプは不要もしくは一部をフィルタして利用したいため作成した。  
セキュリティ上念のため mysql2 やmysqldump のライブラリは使用せずにnodejsでCLIを直接叩く設計意図があります。  

## Attention
* mysql, mysqldump コマンドを叩ける環境で実行する必要があります。
* 移行先のテーブルにインポート(update)するため、誤って運用中のDBを移行先に設定して実行すると大変なことになります。
* 本プログラムを使用したことによるあらゆる損害の責任を作成者は負わないものとする。

## Run
1. npmインストール
    ```
    npm install
    ```

2. 環境変数を設定
    ```
    cp .env.example .env
    ```
    | key | sample | description |
    | :---- | :---- | :---- |
    | IS_DEBUG | true | デバッグモード実行フラグ |
    | USE_DIR | ./sql/ |ダンプファイルの格納先 |
    | IS_DELETE_FILE | true | 処理実行後にダンプファイルを削除 |
    | TG_DB_HOST | 127.0.0.1 | 移行元 HOST |
    | TG_DB_NAME | test_db1 | 移行元 DB |
    | TG_DB_USER | root | 移行元 USER |
    | TG_DB_PASSWORD | 1q2w3e4r | 移行元 PASSWORD |
    | START_DATE | 20221001 | フィルタ between.date 開始日 |
    | END_DATE | 20221110 | フィルタ between.date 終了日 |
    | MG_DB_HOST | 127.0.0.1 | 移行先 HOST |
    | MG_DB_NAME | test_db2 | 移行先 DB |
    | MG_DB_USER | root | 移行先 USER |
    | MG_DB_PASSWORD | 1q2w3e4r | 移行先 PASSWORD |

3. テーブル情報を設定
    ```
    cp tables.example.json tables.json
    ```

    | key | description |
    | :---- | :---- |
    | tableName | 対象のテーブル名 |
    | filter.type | コード内の分岐処理用 |
    | filter.column | フィルタ対象のカラム |

    | type | description |
    | :---- | :---- |
    | between.date | 期間指定 |

    ```
    {
      "data": [
        {
          "tableName": "owners",
          "filter": {
            "type": "between.date",
            "column": "created_at"
          }
        }
      ]
    }
    ```

4. 実行
    ```
    node index.js
    ```
    ```
    ===== Migrate Start => Debug Mode: false =====
    mysqldump --host=127.0.0.1 --user=root --password= test_db1 shops > ./sql/test_db1_table.sql
    mysql --host=127.0.0.1 --user=root --password= test_db2 < ./sql/test_db2_table.sql
    ===== Migrate End =====
    ```
