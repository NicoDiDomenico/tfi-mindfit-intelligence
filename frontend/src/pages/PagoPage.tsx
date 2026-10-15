import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LandingHeader } from '../components/landing/LandingHeader'
import { PublicFooter } from '../components/landing/PublicFooter'
import { paypalService, type PayPalConfig } from '../services/paypalService'
import { saveApprovedPayPalSubscription } from '../utils/paypalPayment'

interface PayPalApproveData {
  subscriptionID?: string
}

interface PayPalSubscriptionActions {
  subscription: {
    create: (payload: { plan_id: string }) => Promise<string>
  }
}

interface PayPalButtonsOptions {
  style?: Record<string, string>
  createSubscription: (
    data: unknown,
    actions: PayPalSubscriptionActions,
  ) => Promise<string>
  onApprove: (data: PayPalApproveData) => void | Promise<void>
  onCancel: () => void
  onError: (error: unknown) => void
}

interface PayPalNamespace {
  Buttons: (options: PayPalButtonsOptions) => {
    render: (selectorOrElement: string | HTMLElement) => Promise<void>
  }
}

declare global {
  interface Window {
    paypal?: PayPalNamespace
  }
}

const PAYPAL_SCRIPT_ID = 'paypal-subscription-sdk'

function loadPayPalSdk(clientId: string, currency: string) {
  const existingScript = document.getElementById(PAYPAL_SCRIPT_ID) as HTMLScriptElement | null

  if (existingScript) {
    return new Promise<void>((resolve, reject) => {
      if (window.paypal) {
        resolve()
        return
      }

      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('No se pudo cargar PayPal.')), {
        once: true,
      })
    })
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.id = PAYPAL_SCRIPT_ID
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
      clientId,
    )}&vault=true&intent=subscription&currency=${encodeURIComponent(currency)}`
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('No se pudo cargar PayPal.'))
    document.body.appendChild(script)
  })
}

export function PagoPage() {
  const navigate = useNavigate()
  const paypalButtonsRef = useRef<HTMLDivElement | null>(null)
  const [config, setConfig] = useState<PayPalConfig | null>(null)
  const [statusMessage, setStatusMessage] = useState('Preparando el pago seguro...')
  const [errorMessage, setErrorMessage] = useState('')
  const [isApproving, setIsApproving] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function fetchConfig() {
      try {
        const nextConfig = await paypalService.getConfig()
        if (isMounted) {
          setConfig(nextConfig)
          setStatusMessage('Elegí PayPal para completar el alta.')
        }
      } catch {
        if (isMounted) {
          setErrorMessage('No pudimos preparar PayPal. Revisá la configuración del backend.')
          setStatusMessage('')
        }
      }
    }

    fetchConfig()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!config || !paypalButtonsRef.current) {
      return
    }

    const currentConfig = config
    const buttonsContainer = paypalButtonsRef.current
    let isMounted = true
    buttonsContainer.innerHTML = ''
    setErrorMessage('')

    async function renderButtons() {
      try {
        await loadPayPalSdk(currentConfig.clientId, currentConfig.currency)

        if (!isMounted || !window.paypal) {
          return
        }

        await window.paypal.Buttons({
          style: {
            layout: 'vertical',
            shape: 'rect',
            label: 'subscribe',
          },
          createSubscription: (_data, actions) => {
            return actions.subscription.create({
              plan_id: currentConfig.planId,
            })
          },
          onApprove: async (data) => {
            const subscriptionId = data.subscriptionID
            if (!subscriptionId) {
              setErrorMessage('PayPal no devolvió la suscripción. Intentá nuevamente.')
              return
            }

            setIsApproving(true)
            setStatusMessage('Validando la suscripción...')

            try {
              const subscription = await paypalService.getSubscriptionStatus(subscriptionId)

              if (!subscription.isApproved) {
                setErrorMessage('La suscripción todavía no figura activa en PayPal.')
                setStatusMessage('')
                return
              }

              saveApprovedPayPalSubscription(subscriptionId)
              navigate('/registro-gym')
            } catch {
              setErrorMessage('No pudimos validar la suscripción con PayPal.')
              setStatusMessage('')
            } finally {
              setIsApproving(false)
            }
          },
          onCancel: () => {
            setErrorMessage('Cancelaste el pago. Podés intentarlo de nuevo cuando quieras.')
          },
          onError: () => {
            setErrorMessage('PayPal no pudo procesar la operación. Intentá nuevamente.')
          },
        }).render(buttonsContainer)
      } catch {
        if (isMounted) {
          setErrorMessage('No pudimos cargar el botón de PayPal.')
          setStatusMessage('')
        }
      }
    }

    renderButtons()

    return () => {
      isMounted = false
      buttonsContainer.innerHTML = ''
    }
  }, [config, navigate])

  return (
    <main className="landing-page payment-page">
      <LandingHeader />

      <div className="payment-layout">
        <section className="payment-summary" aria-labelledby="payment-title">
          <span>Alta MindFit Intelligence</span>
          <h1 id="payment-title">Completá el pago para registrar tu gimnasio</h1>
          <p>
            PayPal procesa el cobro inicial de USD 320 y deja activa la suscripción mensual de
            USD 160. Estás usando sandbox, así que no se mueve plata real.
          </p>

          <div className="payment-breakdown" aria-label="Detalle del plan">
            <div>
              <strong>USD 320</strong>
              <span>Pago único de instalación y capacitación</span>
            </div>
            <div>
              <strong>USD 160</strong>
              <span>Suscripción mensual</span>
            </div>
          </div>
        </section>

        <section className="payment-checkout" aria-label="Checkout PayPal">
          <div className="payment-checkout__heading">
            <Link className="payment-secondary-link payment-secondary-link--heading" to="/precios">
              <span aria-hidden="true" className="payment-secondary-link__icon">
                &larr;
              </span>
              Volver a precios
            </Link>
            <h2>Pago seguro</h2>
            <p>{statusMessage || 'Revisá el estado del pago.'}</p>
          </div>

          <div ref={paypalButtonsRef} className="payment-paypal-buttons" aria-live="polite" />

          {isApproving ? <p className="payment-status">Validando con PayPal...</p> : null}
          {errorMessage ? (
            <div className="payment-alert" role="alert">
              {errorMessage}
            </div>
          ) : null}

        </section>
      </div>

      <PublicFooter />
    </main>
  )
}
