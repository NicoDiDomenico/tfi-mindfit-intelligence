import Select, { type SingleValue, type StylesConfig } from 'react-select'
import type { GymPublico } from '../../types/gym'

interface GymOption {
  value: number
  label: string
}

interface GymSelectProps {
  gyms: GymPublico[]
  selectedGymId: number | null
  onChange: (gymId: number | null, gymName: string | null) => void
  isDisabled?: boolean
}

const selectStyles: StylesConfig<GymOption, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: 53,
    borderRadius: 16,
    borderColor: state.isFocused ? '#0f766e' : 'rgba(148, 163, 184, 0.45)',
    boxShadow: state.isFocused ? '0 0 0 4px rgba(15, 118, 110, 0.12)' : 'none',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    '&:hover': {
      borderColor: '#0f766e',
    },
  }),
  menu: (base) => ({
    ...base,
    borderRadius: 16,
    overflow: 'hidden',
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? '#0f766e'
      : state.isFocused
        ? 'rgba(15, 118, 110, 0.12)'
        : '#ffffff',
    color: state.isSelected ? '#f8fafc' : '#0f172a',
  }),
  placeholder: (base) => ({
    ...base,
    color: '#64748b',
  }),
}

export function GymSelect({
  gyms,
  selectedGymId,
  onChange,
  isDisabled = false,
}: GymSelectProps) {
  const options: GymOption[] = gyms.map((gym) => ({
    value: gym.idGym,
    label: gym.nombreGym,
  }))

  const value = options.find((option) => option.value === selectedGymId) ?? null

  function handleChange(option: SingleValue<GymOption>) {
    onChange(option?.value ?? null, option?.label ?? null)
  }

  return (
    <Select<GymOption, false>
      inputId="gym-select"
      options={options}
      value={value}
      onChange={handleChange}
      isDisabled={isDisabled}
      placeholder="Selecciona tu gimnasio"
      noOptionsMessage={() => 'No hay gimnasios disponibles'}
      isSearchable
      styles={selectStyles}
    />
  )
}
