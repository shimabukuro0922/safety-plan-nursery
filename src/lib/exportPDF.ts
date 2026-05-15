/**
 * PDF直接生成ユーティリティ
 * html2canvas で DOM をキャプチャし、jsPDF で PDF に変換してダウンロードする。
 * 日本語テキストを追加フォントなしで正確に出力できる。
 */
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export interface ExportPDFOptions {
  filename?: string       // ダウンロードファイル名（拡張子なし）
  scale?: number          // キャプチャ解像度（デフォルト2 = 高品質）
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
    scale = 2,
    margin = 10,
    onProgress,
  } = options

  onProgress?.(10)

  // DOM をキャプチャ
  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: '#ffffff',
    // スクロール位置をリセットして全体をキャプチャ
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  })

  onProgress?.(60)

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
  const imgHeightMM = (canvas.height * contentW) / canvas.width

  if (imgHeightMM <= contentH) {
    // 1ページに収まる場合
    pdf.addImage(
      canvas.toDataURL('image/jpeg', 0.92),
      'JPEG',
      margin, margin,
      contentW, imgHeightMM
    )
  } else {
    // 複数ページに分割
    const pxPerMM = canvas.width / contentW
    const pageHeightPx = Math.round(contentH * pxPerMM)
    let remainingPx = canvas.height
    let srcY = 0
    let firstPage = true

    while (remainingPx > 0) {
      if (!firstPage) pdf.addPage()
      firstPage = false

      const sliceH = Math.min(pageHeightPx, remainingPx)

      // ページ分のスライスを別 canvas に描画
      const sliceCanvas = document.createElement('canvas')
      sliceCanvas.width = canvas.width
      sliceCanvas.height = sliceH
      const ctx = sliceCanvas.getContext('2d')!
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height)
      ctx.drawImage(canvas, 0, srcY, canvas.width, sliceH, 0, 0, canvas.width, sliceH)

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
