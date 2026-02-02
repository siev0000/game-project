@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM ===== ① 参照元フォルダ選択 =====
for /f "usebackq delims=" %%D in (`
  powershell -NoProfile -STA -Command ^
    "Add-Type -AssemblyName System.Windows.Forms; ^
     $dlg = New-Object System.Windows.Forms.FolderBrowserDialog; ^
     $dlg.Description = '【参照元】ファイル一覧を取得するフォルダを選択してください'; ^
     if ($dlg.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { $dlg.SelectedPath }"
`) do (
  set "input_dir=%%D"
)

if not defined input_dir (
  echo 参照元フォルダが選択されませんでした。
  pause
  exit /b
)

REM ===== ② 出力先フォルダ選択 =====
for /f "usebackq delims=" %%D in (`
  powershell -NoProfile -STA -Command ^
    "Add-Type -AssemblyName System.Windows.Forms; ^
     $dlg = New-Object System.Windows.Forms.FolderBrowserDialog; ^
     $dlg.Description = '【出力先】JSONを出力するフォルダを選択してください'; ^
     if ($dlg.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { $dlg.SelectedPath }"
`) do (
  set "output_dir=%%D"
)

if not defined output_dir (
  echo 出力先フォルダが選択されませんでした。
  pause
  exit /b
)

REM ===== 出力ファイル =====
set "output_file=%output_dir%\effect_list.json"

REM ===== JSON生成 =====
powershell -NoProfile -Command ^
  "$list = Get-ChildItem -LiteralPath '%input_dir%' -File | ^
    Where-Object { $_.Extension -ne '.bat' } | ^
    ForEach-Object { $_.BaseName }; ^
   $json = $list | ConvertTo-Json -Depth 1; ^
   Set-Content -LiteralPath '%output_file%' -Value $json -Encoding UTF8"

echo.
echo ✅ JSON作成完了
echo 参照元: %input_dir%
echo 出力先: %output_file%
pause
