import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign,
} from 'docx'
import fs from 'fs'

const BLUE       = '1B5EA8'
const BLUE_LIGHT = 'DBEAFE'
const BLUE_MID   = '2563EB'
const GREEN      = '15803D'
const GREEN_LIGHT= 'DCFCE7'
const ORANGE_LT  = 'FFF7ED'
const GRAY       = '475569'
const GRAY_LIGHT = 'F1F5F9'
const WHITE      = 'FFFFFF'
const DARK       = '1E293B'

const nb = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
const NB = { top: nb, bottom: nb, left: nb, right: nb }
const tb = { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' }
const TB = { top: tb, bottom: tb, left: tb, right: tb }

// A4: 11906 x 16838, margin 720 each side
const CW = 11906 - 720 * 2  // 10466

function bgCell(children, fill, width, marginsObj) {
  return new TableCell({
    borders: NB,
    shading: { fill, type: ShadingType.CLEAR },
    verticalAlign: VerticalAlign.TOP,
    width: { size: width, type: WidthType.DXA },
    margins: marginsObj || { top: 0, bottom: 0, left: 0, right: 0 },
    children,
  })
}

function thCell(text, fill, bold, color) {
  return new TableCell({
    borders: TB,
    shading: { fill, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, font: 'Meiryo', size: 19, bold: !!bold, color: color || DARK })],
    })],
  })
}

function txt(text, size, bold, color) {
  return new TextRun({ text, font: 'Meiryo', size: size || 20, bold: !!bold, color: color || DARK })
}

function para(runs, align, before, after) {
  return new Paragraph({
    alignment: align || AlignmentType.LEFT,
    spacing: { before: (before || 0) * 20, after: (after || 0) * 20 },
    children: Array.isArray(runs) ? runs : [runs],
  })
}

const sections = []

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. ヘッダー
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
sections.push(new Table({
  width: { size: CW, type: WidthType.DXA },
  columnWidths: [CW],
  rows: [new TableRow({ children: [bgCell([
    para(txt('保育施設の安全管理を、もっとかんたんに。', 21, false, 'BFD8FF'), AlignmentType.CENTER, 6, 2),
    para(txt('まもりすと', 64, true, WHITE), AlignmentType.CENTER, 0, 2),
    para(txt('保育施設専用  安全管理サポートアプリ', 22, false, 'BFD8FF'), AlignmentType.CENTER, 0, 6),
  ], BLUE, CW)] })]
}))

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. お悩み
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
sections.push(para(txt('こんなお悩みありませんか？', 26, true, DARK), AlignmentType.LEFT, 8, 3))

const worries = [
  'ヒヤリハットの記録が面倒で、後回しになりがち',
  '職員によって記録の質がバラバラで、改善につながらない',
  '毎月の安全点検チェックが紙のまま、集計も大変',
  '午睡の見守り記録を「ちゃんと残せているか」不安',
  '万が一のとき、記録がなくて困ったことがある',
]
sections.push(new Table({
  width: { size: CW, type: WidthType.DXA },
  columnWidths: [CW],
  rows: [new TableRow({ children: [bgCell(
    worries.map(w => para([txt('▶  ', 20, true, 'EA580C'), txt(w, 20, false, DARK)], AlignmentType.LEFT, 3, 3)),
    ORANGE_LT, CW, { top: 80, bottom: 80, left: 160, right: 160 }
  )] })]
}))

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. 機能紹介（2列）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
sections.push(para(txt('まもりすとで、すべて解決します', 26, true, DARK), AlignmentType.LEFT, 8, 3))

const features = [
  ['📋 ヒヤリハット記録', '起きた→原因→対策→共有まで ステップ式で迷わず記録'],
  ['✅ 月次・季節前チェック', 'チェック項目はカスタマイズ可能 実施記録が自動で残る'],
  ['😴 午睡見守り記録', '5分ごとの確認をボタン一つで記録 あとから確認も簡単'],
  ['🤖 AI文章作成', '保護者向け周知文・職員資料を AIが自動で下書き作成'],
  ['📅 年間安全カレンダー', '月ごとのテーマと重点項目を 1年分まとめて管理'],
  ['👨‍👩‍👧 職員研修・資格管理', 'AED・誤嚥対応などの研修実績を 一覧でまとめて管理'],
]

const half = 3
const leftF  = features.slice(0, half)
const rightF = features.slice(half)
const fw = Math.floor(CW / 2) - 40

function makeFeatureCells(feats) {
  return feats.map(function(f) {
    return new Table({
      width: { size: fw, type: WidthType.DXA },
      columnWidths: [fw],
      rows: [new TableRow({ children: [bgCell([
        para(txt(f[0], 20, true, BLUE), AlignmentType.LEFT, 3, 1),
        para(txt(f[1], 18, false, GRAY), AlignmentType.LEFT, 0, 3),
      ], BLUE_LIGHT, fw, { top: 60, bottom: 60, left: 100, right: 100 })] })],
    })
  })
}

sections.push(new Table({
  width: { size: CW, type: WidthType.DXA },
  columnWidths: [fw + 40, fw + 40],
  rows: [new TableRow({ children: [
    bgCell(makeFeatureCells(leftF),  BLUE_LIGHT, fw + 40, { top: 40, bottom: 40, left: 40, right: 20 }),
    bgCell(makeFeatureCells(rightF), BLUE_LIGHT, fw + 40, { top: 40, bottom: 40, left: 20, right: 40 }),
  ] })]
}))

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. 他システムとの比較
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
sections.push(para(txt('他のシステムとの違い', 26, true, DARK), AlignmentType.LEFT, 8, 3))

const col1 = CW - 4200 - 2000
const col2 = 4200
const col3 = 2000
const compRows = [
  ['比較ポイント',  'まもりすと',   'コドモン等'],
  ['月額費用',      '5,000円',      '数万円〜'],
  ['対象機能',      '安全管理に特化', '保育全般（多機能）'],
  ['操作の複雑さ',  'シンプル・迷わない', '多機能ゆえに複雑'],
  ['導入期間',      '即日利用可能',  '数週間〜数ヶ月'],
  ['無料トライアル','1ヶ月無料',     '要問い合わせ'],
]
sections.push(new Table({
  width: { size: CW, type: WidthType.DXA },
  columnWidths: [col1, col2, col3],
  rows: compRows.map(function(r, i) {
    if (i === 0) {
      return new TableRow({ children: [
        thCell(r[0], BLUE, true, WHITE),
        thCell(r[1], BLUE, true, WHITE),
        thCell(r[2], BLUE, true, WHITE),
      ]})
    }
    return new TableRow({ children: [
      thCell(r[0], GRAY_LIGHT, false, DARK),
      thCell(r[1], GREEN_LIGHT, true, GREEN),
      thCell(r[2], WHITE, false, GRAY),
    ]})
  })
}))

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5. 導入3ステップ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
sections.push(para(txt('導入の流れ　たった3ステップ', 26, true, DARK), AlignmentType.LEFT, 8, 3))

const stW = Math.floor(CW / 3)
const steps = [
  ['STEP 1', 'お申し込み', 'フォームに入力するだけ（2分で完了）'],
  ['STEP 2', 'コードを受け取る', '24時間以内にメールで招待コードをお送りします'],
  ['STEP 3', 'すぐ使い始める', 'コードを入力してすぐ利用開始。初期設定不要'],
]
sections.push(new Table({
  width: { size: CW, type: WidthType.DXA },
  columnWidths: [stW, stW, stW],
  rows: [new TableRow({ children: steps.map(function(s) {
    return bgCell([
      para(txt(s[0], 19, true, WHITE), AlignmentType.CENTER, 6, 1),
      para(txt(s[1], 21, true, WHITE), AlignmentType.CENTER, 0, 2),
      para(txt(s[2], 18, false, 'BFD8FF'), AlignmentType.CENTER, 0, 6),
    ], BLUE_MID, stW, { top: 80, bottom: 80, left: 60, right: 60 })
  }) })]
}))

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 6. 料金
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
sections.push(para(txt('料金・トライアル', 26, true, DARK), AlignmentType.LEFT, 8, 3))

const prL = 2200
const prR = CW - prL
sections.push(new Table({
  width: { size: CW, type: WidthType.DXA },
  columnWidths: [prL, prR],
  rows: [new TableRow({ children: [
    bgCell([
      para(txt('1ヶ月', 22, true, WHITE), AlignmentType.CENTER, 8, 1),
      para(txt('無料トライアル', 22, true, WHITE), AlignmentType.CENTER, 0, 8),
    ], GREEN, prL, { top: 60, bottom: 60, left: 60, right: 60 }),
    bgCell([
      para(txt('月額　5,000円（税込）', 26, true, DARK), AlignmentType.LEFT, 6, 2),
      para(txt('クレジットカード不要・解約はいつでも可能', 19, false, GRAY), AlignmentType.LEFT, 0, 2),
      para(txt('※ 1ヶ月の無料トライアル後に継続のご意向をお伺いします', 18, false, GRAY), AlignmentType.LEFT, 0, 6),
    ], GREEN_LIGHT, prR, { top: 60, bottom: 60, left: 140, right: 80 }),
  ] })]
}))

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 7. フッター
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
sections.push(para([], AlignmentType.LEFT, 6, 0))

sections.push(new Table({
  width: { size: CW, type: WidthType.DXA },
  columnWidths: [CW],
  rows: [new TableRow({ children: [bgCell([
    para(txt('まずはデモ画面で試してみてください（登録不要・無料）', 22, true, WHITE), AlignmentType.CENTER, 8, 3),
    para(txt('デモURL：https://mamorist.vercel.app', 20, false, 'BFD8FF'), AlignmentType.CENTER, 0, 2),
    para(txt('お申し込み・お問い合わせ：ys.ehon1@gmail.com', 20, false, 'BFD8FF'), AlignmentType.CENTER, 0, 2),
    para(txt('お申し込みフォームはメールにてURLをご案内します', 18, false, '93C5FD'), AlignmentType.CENTER, 0, 8),
  ], BLUE, CW)] })]
}))

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 出力
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const doc = new Document({
  styles: {
    default: { document: { run: { font: 'Meiryo', size: 20, color: DARK } } },
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 720, right: 720, bottom: 720, left: 720 },
      },
    },
    children: sections,
  }],
})

const out = 'C:/Users/sugur/Downloads/safety-plan-app-nursery/まもりすと_チラシ.docx'
Packer.toBuffer(doc).then(function(buf) {
  fs.writeFileSync(out, buf)
  console.log('✅ 作成完了:', out)
}).catch(function(e) {
  console.error('❌ エラー:', e.message)
  process.exit(1)
})
