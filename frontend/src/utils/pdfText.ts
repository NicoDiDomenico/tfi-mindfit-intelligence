import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

GlobalWorkerOptions.workerSrc = pdfWorkerUrl

export async function extractPdfText(file: File) {
  const buffer = await file.arrayBuffer()
  const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise

  try {
    const pagesText: string[] = []

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber)
      const content = await page.getTextContent()
      const pageText = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/[ \t]+/g, ' ')
        .trim()
      const annotations = await page.getAnnotations({ intent: 'display' })
      const formText = annotations
        .map((annotation) => {
          if (!('fieldValue' in annotation)) {
            return ''
          }

          const value = annotation.fieldValue

          if (Array.isArray(value)) {
            return value.join(' ')
          }

          return typeof value === 'string' ? value : ''
        })
        .join('\n')
        .replace(/[ \t]+/g, ' ')
        .trim()
      const combinedPageText = [pageText, formText].filter(Boolean).join('\n\n')

      if (combinedPageText) {
        pagesText.push(combinedPageText)
      }
    }

    const text = pagesText.join('\n\n').trim()

    if (!text) {
      throw new Error('No se detecto texto seleccionable en el PDF. Proba con un PDF que no sea escaneado.')
    }

    return text
  } finally {
    await pdf.cleanup()
  }
}
