#!/data/data/com.termux/files/usr/bin/bash

# プロジェクトのルートディレクトリ
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# dist の場所（frontend のビルド出力）
DIST_DIR="$PROJECT_ROOT/frontend/dist"

# nginx の公開ディレクトリ
NGINX_DIR="/data/data/com.termux/files/usr/share/nginx/html"

echo "=== Building frontend ==="

# frontend ディレクトリに移動してビルド
cd "$PROJECT_ROOT/frontend"
if ! npm run build; then
  echo "Error: Frontend build failed"
  exit 1
fi

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