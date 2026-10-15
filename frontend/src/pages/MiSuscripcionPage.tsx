import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { BackToGymLink } from '../components/BackToHomeLink'
import { FormAlertModal } from '../components/FormAlertModal'
import { useAuth } from '../hooks/useAuth'
import { AppLayout } from '../layouts/AppLayout'
import { gymsService, type GymSubscription, type PayPalConfig } from '../services/gymsService'
import { getApiErrorMessage } from '../utils/apiError'

const VER_MI_SUSCRIPCION = 'VER_MI_SUSCRIPCION'
const PAYPAL_SCRIPT_ID = 'paypal-subscription-sdk'

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

type SubscriptionAction = 'cancel' | 'reactivate'

function getPayPalNamespace() {
  return (window as Window & { paypal?: PayPalNamespace }).paypal
}

function loadPayPalSdk(clientId: string, currency: string) {
  const existingScript = document.getElementById(PAYPAL_SCRIPT_ID) as HTMLScriptElement | null

  if (existingScript) {
    return new Promise<void>((resolve, reject) => {
      if (getPayPalNamespace()) {
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

function formatDateTime(value: string | null) {
  if (!value) {
    return 'No disponible'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'No disponible'
  }

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

function getStatusClass(status: string | null) {
  const normalized = status?.toUpperCase() ?? ''

  if (normalized === 'ACTIVE') return 'mi-suscripcion-status--active'
  if (normalized === 'SUSPENDED') return 'mi-suscripcion-status--warning'
  if (normalized === 'CANCELLED' || normalized === 'EXPIRED') {
    return 'mi-suscripcion-status--danger'
  }

  return 'mi-suscripcion-status--neutral'
}

function getActionTitle(action: SubscriptionAction) {
  return action === 'cancel' ? 'Cancelar suscripcion' : 'Reactivar suscripcion'
}

function getActionCopy(action: SubscriptionAction, subscription: GymSubscription) {
  if (action === 'cancel') {
    return `Al cancelar no habra nuevos cobros. El gimnasio conserva acceso hasta ${formatDateTime(
      subscription.fechaProximoPagoUtc,
    )}.`
  }

  return 'MindFit va a solicitar la reactivacion de la misma suscripcion en PayPal. Si vuelve a estar activa, se habilita el acceso operativo.'
}

export function MiSuscripcionPage() {
  const { session } = useAuth()
  const canViewSubscription = (session?.permisos ?? []).includes(VER_MI_SUSCRIPCION)
  const paypalButtonsRef = useRef<HTMLDivElement | null>(null)
  const [subscription, setSubscription] = useState<GymSubscription | null>(null)
  const [resubscriptionConfig, setResubscriptionConfig] = useState<PayPalConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSubmittingAction, setIsSubmittingAction] = useState(false)
  const [isApprovingResubscription, setIsApprovingResubscription] = useState(false)
  const [actionModal, setActionModal] = useState<SubscriptionAction | null>(null)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [resubscriptionError, setResubscriptionError] = useState('')
  const [resubscriptionStatus, setResubscriptionStatus] = useState('')

  useEffect(() => {
    let isActive = true

    async function loadSubscription() {
      if (!canViewSubscription) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError('')

      try {
        const response = await gymsService.getMiSuscripcion()
        if (isActive) setSubscription(response)
      } catch (loadError) {
        if (isActive) {
          setError(
            getApiErrorMessage(
              loadError,
              'No pudimos cargar la informacion de la suscripcion.',
            ),
          )
        }
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    void loadSubscription()

    return () => {
      isActive = false
    }
  }, [canViewSubscription])

  useEffect(() => {
    let isActive = true

    async function loadResubscriptionConfig() {
      if (!subscription?.puedeVolverASuscribirse) {
        setResubscriptionConfig(null)
        return
      }

      setResubscriptionError('')

      try {
        const config = await gymsService.getResuscripcionConfig()
        if (isActive) setResubscriptionConfig(config)
      } catch (configError) {
        if (isActive) {
          setResubscriptionError(
            getApiErrorMessage(
              configError,
              'No pudimos preparar PayPal para volver a suscribirte.',
            ),
          )
        }
      }
    }

    void loadResubscriptionConfig()

    return () => {
      isActive = false
    }
  }, [subscription?.puedeVolverASuscribirse])

  useEffect(() => {
    if (!resubscriptionConfig || !paypalButtonsRef.current) {
      return
    }

    const config = resubscriptionConfig
    const buttonsContainer = paypalButtonsRef.current
    let isMounted = true
    buttonsContainer.innerHTML = ''
    setResubscriptionError('')
    setResubscriptionStatus('Elegi PayPal para volver a suscribirte.')

    async function renderButtons() {
      try {
        await loadPayPalSdk(config.clientId, config.currency)

        const paypal = getPayPalNamespace()
        if (!isMounted || !paypal) {
          return
        }

        await paypal.Buttons({
          style: {
            layout: 'vertical',
            shape: 'rect',
            label: 'subscribe',
          },
          createSubscription: (_data, actions) => {
            return actions.subscription.create({
              plan_id: config.planId,
            })
          },
          onApprove: async (data) => {
            const subscriptionId = data.subscriptionID
            if (!subscriptionId) {
              setResubscriptionError('PayPal no devolvio la nueva suscripcion.')
              return
            }

            setIsApprovingResubscription(true)
            setResubscriptionStatus('Validando la nueva suscripcion...')

            try {
              const response = await gymsService.confirmarResuscripcion(subscriptionId)
              setSubscription(response)
              setSuccessMessage('Suscripcion reactivada correctamente.')
              setResubscriptionStatus('')
            } catch (confirmError) {
              setResubscriptionError(
                getApiErrorMessage(
                  confirmError,
                  'No pudimos confirmar la nueva suscripcion.',
                ),
              )
              setResubscriptionStatus('')
            } finally {
              setIsApprovingResubscription(false)
            }
          },
          onCancel: () => {
            setResubscriptionError('Cancelaste la suscripcion. Podes intentarlo nuevamente.')
          },
          onError: () => {
            setResubscriptionError('PayPal no pudo procesar la operacion.')
          },
        }).render(buttonsContainer)
      } catch {
        if (isMounted) {
          setResubscriptionError('No pudimos cargar el boton de PayPal.')
          setResubscriptionStatus('')
        }
      }
    }

    void renderButtons()

    return () => {
      isMounted = false
      buttonsContainer.innerHTML = ''
    }
  }, [resubscriptionConfig])

  if (!canViewSubscription) {
    return <Navigate to="/gimnasio" replace />
  }

  async function handleRefresh() {
    setIsRefreshing(true)
    setError('')
    setSuccessMessage('')

    try {
      const response = await gymsService.actualizarMiSuscripcion()
      setSubscription(response)
      setSuccessMessage('Estado actualizado correctamente.')
    } catch (refreshError) {
      setError(
        getApiErrorMessage(
          refreshError,
          'No pudimos actualizar el estado de la suscripcion.',
        ),
      )
    } finally {
      setIsRefreshing(false)
    }
  }

  async function handleConfirmAction() {
    if (!actionModal) return

    setIsSubmittingAction(true)
    setError('')
    setSuccessMessage('')

    try {
      const response =
        actionModal === 'cancel'
          ? await gymsService.cancelarMiSuscripcion()
          : await gymsService.reactivarMiSuscripcion()

      setSubscription(response)
      setSuccessMessage(
        actionModal === 'cancel'
          ? 'Suscripcion cancelada correctamente.'
          : 'Suscripcion reactivada correctamente.',
      )
      setActionModal(null)
    } catch (actionError) {
      setError(
        getApiErrorMessage(
          actionError,
          actionModal === 'cancel'
            ? 'No pudimos cancelar la suscripcion.'
            : 'No pudimos reactivar la suscripcion.',
        ),
      )
    } finally {
      setIsSubmittingAction(false)
    }
  }

  return (
    <AppLayout>
      <main className="mi-suscripcion-page">
        <section className="mi-suscripcion-hero">
          <div>
            <span className="section-kicker">Gestionar gimnasio / Mi suscripcion</span>
            <h1 className="dashboard-title">Mi suscripcion</h1>
            <div className="mi-suscripcion-copy-row">
              <p className="dashboard-copy">
                Consulta el estado actual informado por PayPal
              </p>
              <BackToGymLink />
            </div>
          </div>
        </section>

        {isLoading ? <p className="inicio-status">Cargando suscripcion...</p> : null}

        {error ? (
          <div className="mi-suscripcion-alert mi-suscripcion-alert--error" role="alert">
            {error}
          </div>
        ) : null}

        {successMessage ? <FormAlertModal type="success" message={successMessage} /> : null}

        {!isLoading && subscription ? (
          <section className="mi-suscripcion-panel" aria-labelledby="mi-suscripcion-title">
            <div className="mi-suscripcion-panel__heading">
              <div>
                <span className="section-kicker">PayPal</span>
                <h2 id="mi-suscripcion-title">Estado de la suscripcion</h2>
              </div>
              <button
                type="button"
                className="mi-suscripcion-refresh-button"
                disabled={isRefreshing}
                aria-label={isRefreshing ? 'Actualizando estado' : 'Actualizar estado'}
                title={isRefreshing ? 'Actualizando estado' : 'Actualizar estado'}
                onClick={handleRefresh}
              >
                <svg
                  className="mi-suscripcion-refresh-icon"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M20 11a8 8 0 0 0-14.6-4.5" />
                  <path d="M5 3v5h5" />
                  <path d="M4 13a8 8 0 0 0 14.6 4.5" />
                  <path d="M19 21v-5h-5" />
                </svg>
              </button>
            </div>

            <div className="mi-suscripcion-status-row">
              <span
                className={`mi-suscripcion-status ${getStatusClass(
                  subscription.estadoSuscripcionPayPal,
                )}`}
              >
                {subscription.estadoSuscripcionTexto}
              </span>
              {subscription.accesoBloqueadoPorSuscripcion ? (
                <span className="mi-suscripcion-access-badge">Acceso operativo bloqueado</span>
              ) : null}
            </div>

            {subscription.mensajeCliente ? (
              <p className="mi-suscripcion-message">{subscription.mensajeCliente}</p>
            ) : null}

            <dl className="mi-suscripcion-grid">
              <div>
                <dt>Estado PayPal</dt>
                <dd>{subscription.estadoSuscripcionTexto}</dd>
              </div>
              <div>
                <dt>Importe mensual</dt>
                <dd>{formatMoney(subscription.importeMensual, subscription.moneda)}</dd>
              </div>
              <div>
                <dt>Proximo pago</dt>
                <dd>{formatDateTime(subscription.fechaProximoPagoUtc)}</dd>
              </div>
              <div>
                <dt>Conservas acceso hasta</dt>
                <dd>{formatDateTime(subscription.fechaAccesoHastaUtc)}</dd>
              </div>
              <div>
                <dt>Ultima verificacion</dt>
                <dd>{formatDateTime(subscription.fechaUltimaVerificacionPayPalUtc)}</dd>
              </div>
            </dl>

            {subscription.motivoAccionDeshabilitada ? (
              <p className="mi-suscripcion-hint">{subscription.motivoAccionDeshabilitada}</p>
            ) : null}

            <div className="mi-suscripcion-actions">
              {subscription.puedeCancelar ? (
                <button
                  type="button"
                  className="mi-suscripcion-danger-button"
                  onClick={() => setActionModal('cancel')}
                >
                  Cancelar suscripcion
                </button>
              ) : null}

              {subscription.puedeReactivar ? (
                <button type="button" onClick={() => setActionModal('reactivate')}>
                  Reactivar suscripcion
                </button>
              ) : null}
            </div>

            {subscription.puedeVolverASuscribirse ? (
              <section className="mi-suscripcion-resubscribe" aria-label="Volver a suscribirme">
                <div>
                  <h3>Volver a suscribirme</h3>
                  <p>Se cobrara solamente la suscripcion mensual de USD 160.</p>
                </div>
                <div ref={paypalButtonsRef} className="payment-paypal-buttons" aria-live="polite" />
                {isApprovingResubscription ? (
                  <p className="payment-status">Validando con PayPal...</p>
                ) : null}
                {resubscriptionStatus ? (
                  <p className="mi-suscripcion-hint">{resubscriptionStatus}</p>
                ) : null}
                {resubscriptionError ? (
                  <div className="mi-suscripcion-alert mi-suscripcion-alert--error" role="alert">
                    {resubscriptionError}
                  </div>
                ) : null}
              </section>
            ) : null}

            {subscription.payPalSubscriptionId ? (
              <p className="mi-suscripcion-reference">
                Referencia PayPal: <span>{subscription.payPalSubscriptionId}</span>
              </p>
            ) : null}
          </section>
        ) : null}

        {actionModal && subscription ? (
          <div className="mi-suscripcion-modal-backdrop" role="presentation">
            <section
              className="mi-suscripcion-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="mi-suscripcion-action-title"
            >
              <div className="mi-suscripcion-modal__header">
                <div>
                  <span>PayPal</span>
                  <h2 id="mi-suscripcion-action-title">{getActionTitle(actionModal)}</h2>
                </div>
                <button
                  type="button"
                  className="mi-suscripcion-modal__close"
                  aria-label="Cerrar"
                  onClick={() => setActionModal(null)}
                >
                  x
                </button>
              </div>

              <div className="mi-suscripcion-modal__body">
                <p className="mi-suscripcion-modal__label">Confirma la accion</p>
                <p className="mi-suscripcion-modal__copy">
                  {getActionCopy(actionModal, subscription)}
                </p>
              </div>

              <div className="mi-suscripcion-modal__actions">
                <button type="button" onClick={() => setActionModal(null)}>
                  Volver
                </button>
                <button
                  type="button"
                  className={actionModal === 'cancel' ? 'mi-suscripcion-modal__danger' : undefined}
                  disabled={isSubmittingAction}
                  onClick={() => void handleConfirmAction()}
                >
                  {isSubmittingAction ? 'Confirmando...' : getActionTitle(actionModal)}
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </main>
    </AppLayout>
  )
}
