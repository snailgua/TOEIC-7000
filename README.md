# 多益 7000・單字衝刺 📚🔥

一個月刷完多益 7000 單字的**遊戲化間隔複習（SRS）App**。手機友善、可離線（PWA）、進度存在裝置本機。

> 目標：用「每天新單字 + 間隔複習」的節奏，一個月把 7000 字刷過一輪，並靠 SRS 把它們記熟。

## ✨ 功能

- **一個月計畫**：5,656 個去重單字，預設每天約 189 字（可在設定調整速度），首頁有 Day X/30 進度環。
- **間隔複習引擎（Leitner SRS）**：每個單字有熟練度等級，答對往上升、答錯往下掉，到期才會再考你，自動幫你安排複習。
- **5 種遊戲模式**：
  - 🃏 **閃卡**：學新單字，翻面看中文 + 發音
  - 🟢 **看英選中** / 🔵 **看中選英**：四選一
  - 🎧 **聽力**：聽發音選意思
  - ⌨️ **拼字**：看中文拼出英文
- **遊戲化**：XP / 等級、🔥 連續天數、連對 combo、金幣、10 種成就徽章、升級與全對時的彩帶慶祝、音效。
- **單字庫**：搜尋、依「已學 / 精熟 / 易錯 / 未學」篩選，點一下發音。
- **離線可用**：Service Worker 快取，裝到主畫面像 App 一樣用。
- **換裝置**：設定頁可匯出／匯入進度檔（JSON）。

## 🛠 技術

Vite + React + TypeScript + Tailwind CSS v4。純前端、無後端，資料與進度都在瀏覽器（localStorage）。發音用瀏覽器內建的 Web Speech API，音效用 Web Audio 即時合成（無音檔）。

## 🚀 開發

```bash
npm install
npm run dev        # 本機開發
npm run build      # 生產建置（輸出到 dist/）
npm run preview    # 預覽建置結果
```

### 部署到 GitHub Pages

已內建 `.github/workflows/deploy.yml`。到 repo 的 **Settings → Pages**，把 Source 設成 **GitHub Actions**，推上 branch 後就會自動建置部署，網址為 `https://<帳號>.github.io/TOEIC-7000/`。

> 若要部署到網域根目錄或別的路徑，建置時設環境變數 `BASE_PATH`，例如 `BASE_PATH=/ npm run build`。

## 📖 單字資料來源

台灣大考中心**高中英文參考詞彙表**（學測 4000 ＋ 指考 7000，也是多益的核心字庫），整理自開源資料集
[`mahavivo/english-wordlists`](https://github.com/mahavivo/english-wordlists)，
經 `scripts/parse.py` 解析、去重、轉碼為繁體中文，輸出 `src/data/words.json`（含詞性、中文釋義、難度分級），僅供學習用途。

## 📁 結構

```
src/
├── data/words.json        # 5,656 個單字（詞性 + 繁中釋義 + 分級）
├── lib/
│   ├── words.ts           # 單字載入、排序、發音、選項產生
│   ├── srs.ts             # Leitner 間隔複習邏輯
│   ├── store.ts           # 狀態、localStorage、XP/等級/連續/徽章、計畫
│   ├── session.ts         # 今日任務 / 複習 / 單模式練習的出題
│   ├── audio.ts           # Web Audio 音效
│   └── confetti.ts        # 彩帶慶祝
├── components/            # Home / Session / Browse / Achievements / Settings ...
└── App.tsx
scripts/parse.py           # 由原始字表產生 words.json 的一次性腳本
```
