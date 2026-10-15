import { useId, useRef } from 'react'
import type { ChangeEvent } from 'react'

interface PlanAlimenticioUploadButtonProps {
  disabled?: boolean
  isLoading?: boolean
  onFileSelected: (file: File) => void
}

export function PlanAlimenticioUploadButton({
  disabled = false,
  isLoading = false,
  onFileSelected,
}: PlanAlimenticioUploadButtonProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (file) {
      onFileSelected(file)
    }

    event.target.value = ''
  }

  return (
    <>
      <button
        className="perfil-ia-file-upload"
        type="button"
        aria-label="Cargar archivo de plan alimenticio"
        title="Cargar PDF"
        disabled={disabled || isLoading}
        onClick={() => inputRef.current?.click()}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
          <path d="M12 15V3" />
          <path d="M7 8l5-5 5 5" />
          <path d="M5 15v4h14v-4" />
        </svg>
      </button>
      <input
        ref={inputRef}
        id={inputId}
        className="perfil-ia-file-input"
        type="file"
        accept="application/pdf,.pdf"
        disabled={disabled || isLoading}
        onChange={handleFileChange}
      />
    </>
  )
}
