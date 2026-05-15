declare global {
  interface Window {
    loadJokulCheckout?: (paymentUrl: string) => void;
  }
}

const DOKU_CHECKOUT_SCRIPT_ID = 'doku-checkout-sdk';

function getDokuCheckoutScriptUrl() {
  return 'https://sandbox.doku.com/jokul-checkout-js/v1/jokul-checkout-1.0.0.js';
}

export function loadDokuCheckoutScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.loadJokulCheckout) {
      resolve();
      return;
    }

    const existingScript = document.getElementById(DOKU_CHECKOUT_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Failed to load DOKU Checkout')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = DOKU_CHECKOUT_SCRIPT_ID;
    script.src = getDokuCheckoutScriptUrl();
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load DOKU Checkout'));
    document.head.appendChild(script);
  });
}

export function openDokuCheckout(paymentUrl: string) {
  if (window.loadJokulCheckout) {
    window.loadJokulCheckout(paymentUrl);
    return;
  }

  window.location.href = paymentUrl;
}
