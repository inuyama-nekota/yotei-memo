#!/bin/zsh
cd "$(dirname "$0")"

PORT=8771

if command -v python3 >/dev/null 2>&1; then
  PYTHON=python3
elif command -v python >/dev/null 2>&1; then
  PYTHON=python
else
  osascript -e 'display dialog "Pythonが見つからないため起動できませんでした。" buttons {"OK"} default button "OK" with icon stop'
  exit 1
fi

(sleep 1; open "http://127.0.0.1:${PORT}") &

echo "予定メモを起動しています。"
echo "ブラウザが開かない場合は http://127.0.0.1:${PORT} を開いてください。"
echo "終了するときは、この画面で Control + C を押してください。"
echo ""

"$PYTHON" -m http.server "$PORT" --bind 127.0.0.1
