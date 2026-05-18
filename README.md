# 📦 Pleasanter Sync Extension

Pleasanter の **Scripts / Styles / Htmls / ServerScripts をローカルファイルから同期する VSCode 拡張**です。  
ファイル保存またはコマンドから、Pleasanter のサイトへ自動反映します。

---

## ✅ 機能概要

### 1. ファイル単位同期（自動）
- VSCodeでファイル保存時に自動実行
- 対象：
  - Scripts
  - Styles
  - Htmls
  - ServerScripts

---

### 2. サイト単位同期（手動）

コマンド：

Ctrl + Alt + P（Macは Cmd + Alt + P）

---

### 3. Utility 共通コード対応

```yaml
utility:
  prefix: 共通：
```

```
Utility/
  Scripts/
    処理A
```

```yaml
sites:
  サイトA:
    Scripts:
      共通：処理A: {}
```

---

## 📁 ディレクトリ構成

```
workspace/
├─ pleasanter.yml
├─ .env
├─ Utility/
├─ サイトA/
```

---

## ⚙️ 設定

### pleasanter.yml

```yaml
apiKey: ${API_KEY}
apiVersion: 1.1
baseUrl: https://example.com
```

### .env

```env
API_KEY=xxxxxxxxxxxxxxxx
```

---

## ✅ 同期仕様

- YAML順で同期
- Utility prefix対応
- 自動ID付与

---

## 🚀 使い方

1. ファイル保存 → 自動同期
2. Ctrl+Alt+P → サイト選択 → 全同期

---

## ⚠️ 注意

- siteId 必須
- env 必須
- YAMLとファイル一致必須

---

## ✅ まとめ

- Git管理可能
- 一括同期対応
- 共通化可能
