import { useEffect, useRef, useState } from 'react'

const SCRIPT_ID = 'google-identity-services'

export default function GoogleAuthButton({ onCredential, disabled = false, text = 'continue_with' }) {
  const buttonRef = useRef(null)
  const [scriptError, setScriptError] = useState('')
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const error = clientId ? scriptError : 'Google login is not configured'

  useEffect(() => {
    if (!clientId) {
      return
    }

    const renderButton = () => {
      if (!window.google || !buttonRef.current) return

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response.credential) onCredential(response.credential)
        }
      })

      buttonRef.current.innerHTML = ''
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text,
        width: buttonRef.current.offsetWidth || 360
      })
    }

    const existingScript = document.getElementById(SCRIPT_ID)
    if (existingScript) {
      if (window.google) renderButton()
      else existingScript.addEventListener('load', renderButton, { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = renderButton
    script.onerror = () => setScriptError('Could not load Google login')
    document.body.appendChild(script)
  }, [clientId, onCredential, text])

  if (error) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-700">
        {error}
      </div>
    )
  }

  return (
    <div className={disabled ? 'pointer-events-none opacity-60' : ''}>
      <div ref={buttonRef} className="flex min-h-[44px] justify-center" />
    </div>
  )
}
