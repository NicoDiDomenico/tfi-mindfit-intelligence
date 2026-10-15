const PAYPAL_SUBSCRIPTION_STORAGE_KEY = 'mindfit_paypal_subscription_id'

export function saveApprovedPayPalSubscription(subscriptionId: string) {
  window.localStorage.setItem(PAYPAL_SUBSCRIPTION_STORAGE_KEY, subscriptionId)
}

export function getApprovedPayPalSubscriptionId() {
  return window.localStorage.getItem(PAYPAL_SUBSCRIPTION_STORAGE_KEY)
}

export function clearApprovedPayPalSubscription() {
  window.localStorage.removeItem(PAYPAL_SUBSCRIPTION_STORAGE_KEY)
}
