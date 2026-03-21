#!/data/data/com.termux/files/usr/bin/bash

# dist の場所（必要に応じて変更）
DIST_DIR="./dist"

# nginx の公開ディレクトリ
NGINX_DIR="/data/data/com.termux/files/usr/share/nginx/html"

echo "=== Deploying dist → nginx html ==="

# dist が存在するか確認
if [ ! -d "$DIST_DIR" ]; then
  echo "Error: $DIST_DIR が存在しません"
  exit 1
fi

# 50x.html を残して他を削除
echo "→ 既存ファイルを削除中（50x.html は残します）..."
find "$NGINX_DIR" -mindepth 1 -maxdepth 1 ! -name "50x.html" -exec rm -rf {} \;

# dist の中身をコピー
echo "→ dist の内容をコピー中..."
cp -r $DIST_DIR/* $NGINX_DIR/

echo "=== デプロイ完了 ==="