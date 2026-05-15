/**
 * PDF直接生成ユーティリティ
 * html-to-image で DOM をキャプチャし、jsPDF で PDF に変換してダウンロードする。
 * html2canvas と異なり Tailwind v4 の oklch カラーに対応している。
 */
import * as htmlToImage from 'html-to-image'
import jsPDF from 'jspdf'

export interface ExportPDFOptions {
  filename?: string       // ダウンロードファイル名（拡張子なし）
  margin?: number         // ページ余白 mm（デフォルト10）
  onProgress?: (pct: number) => void
}

/**
 * 指定した DOM 要素を A4 PDF として直接ダウンロードする。
 * 長いコンテンツは自動で複数ページに分割される。
 */
export async function exportToPDF(
  element: HTMLElement,
  options: ExportPDFOptions = {}
): Promise<void> {
  const {
    filename = 'document',
    margin = 10,
    onProgress,
  } = options

  onProgress?.(10)

  // DOM をキャプチャ（oklch 対応）
  const dataUrl = await htmlToImage.toJpeg(element, {
    quality: 0.92,
    backgroundColor: '#ffffff',
    pixelRatio: 2,
  })

  onProgress?.(60)

  // 画像サイズを取得
  const img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = reject
    img.src = dataUrl
  })

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageW = pdf.internal.pageSize.getWidth()   // 210mm
  const pageH = pdf.internal.pageSize.getHeight()  // 297mm
  const contentW = pageW - margin * 2
  const contentH = pageH - margin * 2

  // 画像の実際の高さを mm 換算
  const imgHeightMM = (img.height * contentW) / img.width

  if (imgHeightMM <= contentH) {
    // 1ページに収まる場合
    pdf.addImage(dataUrl, 'JPEG', margin, margin, contentW, imgHeightMM)
  } else {
    // 複数ページに分割
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0)

    const pxPerMM = img.width / contentW
    const pageHeightPx = Math.round(contentH * pxPerMM)
    let remainingPx = img.height
    let srcY = 0
    let firstPage = true

    while (remainingPx > 0) {
      if (!firstPage) pdf.addPage()
      firstPage = false

      const sliceH = Math.min(pageHeightPx, remainingPx)

      const sliceCanvas = document.createElement('canvas')
      sliceCanvas.width = canvas.width
      sliceCanvas.height = sliceH
      const sCtx = sliceCanvas.getContext('2d')!
      sCtx.fillStyle = '#ffffff'
      sCtx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height)
      sCtx.drawImage(canvas, 0, srcY, canvas.width, sliceH, 0, 0, canvas.width, sliceH)

      const sliceHeightMM = (sliceH * contentW) / canvas.width
      pdf.addImage(
        sliceCanvas.toDataURL('image/jpeg', 0.92),
        'JPEG',
        margin, margin,
        contentW, sliceHeightMM
      )

      srcY += sliceH
      remainingPx -= sliceH
    }
  }

  onProgress?.(95)
  pdf.save(`${filename}.pdf`)
  onProgress?.(100)
}
