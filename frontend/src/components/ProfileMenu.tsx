import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import userManagementIcon from '../assets/user-management-96.png'

interface ProfileMenuProps {
  changePasswordPath: string
  links?: readonly {
    label: string
    path: string
  }[]
  onLogout: () => void | Promise<void>
}

export function ProfileMenu({ changePasswordPath, links = [], onLogout }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  function handleLogout() {
    setIsOpen(false)
    onLogout()
  }

  return (
    <div className="workspace-profile" ref={menuRef}>
      <button
        ref={triggerRef}
        className="workspace-profile__trigger"
        type="button"
        aria-label="Abrir menu de perfil"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <img src={userManagementIcon} alt="" aria-hidden="true" />
      </button>

      {isOpen ? (
        <div className="workspace-profile__menu" role="menu" aria-label="Menu de perfil">
          {links.map((link) => (
            <Link
              className="workspace-profile__item"
              to={link.path}
              role="menuitem"
              onClick={() => setIsOpen(false)}
              key={link.path}
            >
              {link.label}
            </Link>
          ))}
          <Link
            className="workspace-profile__item"
            to={changePasswordPath}
            role="menuitem"
            onClick={() => setIsOpen(false)}
          >
            Cambiar contraseña
          </Link>
          <button
            className="workspace-profile__item workspace-profile__logout"
            type="button"
            role="menuitem"
            onClick={handleLogout}
          >
            Cerrar sesión
          </button>
        </div>
      ) : null}
    </div>
  )
}
