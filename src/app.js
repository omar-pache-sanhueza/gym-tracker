import { html } from 'htm/preact'
import { useState, useEffect } from 'preact/hooks'
import Login from './components/Login.js'
import WorkoutSummary from './components/WorkoutSummary.js'
import Bienestar from './components/Bienestar.js'
import WorkoutScreen from './components/WorkoutScreen.js'
import FinishScreen from './components/FinishScreen.js'
import { getWorkoutToday, submitWorkout, logout as apiLogout } from './lib/api.js'
import { saveSession, loadSession, clearSession } from './lib/storage.js'

export default function App() {
  const [screen, setScreen] = useState('init')
  const [workout, setWorkout] = useState(null)
  const [bienestarPre, setBienestarPre] = useState(null)
  const [inicioISO, setInicioISO] = useState(null)
  const [savedEjercicios, setSavedEjercicios] = useState(null)
  const [sesionData, setSesionData] = useState(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [loginError, setLoginError] = useState('')

  // Restaurar sesión interrumpida desde localStorage
  useEffect(() => {
    const saved = loadSession()
    if (saved?.workout && saved?.inicioISO && saved?.bienestarPre) {
      setWorkout(saved.workout)
      setBienestarPre(saved.bienestarPre)
      setInicioISO(saved.inicioISO)
      setSavedEjercicios(saved.ejercicios || null)
      setScreen('workout')
    } else {
      setScreen('login')
    }
  }, [])

  async function handleLogin() {
    setLoginError('')
    setScreen('loading')
    try {
      const data = await getWorkoutToday()
      setWorkout(data)
      setScreen('summary')
    } catch (err) {
      setLoginError(err.message || 'Error al cargar el entrenamiento.')
      setScreen('login')
    }
  }

  async function handleLogout() {
    await apiLogout()
    clearSession()
    setWorkout(null)
    setBienestarPre(null)
    setInicioISO(null)
    setSavedEjercicios(null)
    setScreen('login')
  }

  function handleBienestarDone(bienestar) {
    const inicio = new Date().toISOString()
    setBienestarPre(bienestar)
    setInicioISO(inicio)
    saveSession({ workout, bienestarPre: bienestar, inicioISO: inicio })
    setScreen('workout')
  }

  function handleWorkoutSave(ejercicios) {
    saveSession({ workout, bienestarPre, inicioISO, ejercicios })
  }

  function handleWorkoutDone(ejerciciosEjecutados) {
    const fin = new Date().toISOString()
    setSesionData({
      fecha: workout.fecha,
      inicioISO,
      finISO: fin,
      duracionTotalSeg: Math.floor((new Date(fin) - new Date(inicioISO)) / 1000),
      bienestarPre,
      ejerciciosEjecutados,
      diaNumero: workout.diaNumero,
      diaNombre: workout.diaNombre,
      rpeGlobalSugerido: workout.rpeGlobalSugerido,
    })
    setScreen('finish')
  }

  async function handleSubmit(rpeGeneralDia, comentarioGeneralDia) {
    setSubmitLoading(true)
    setSubmitError('')
    try {
      await submitWorkout({ ...sesionData, rpeGeneralDia, comentarioGeneralDia })
      clearSession()
      setScreen('confirm')
    } catch (err) {
      setSubmitError(err.message || 'Error al enviar. Intenta de nuevo.')
    } finally {
      setSubmitLoading(false)
    }
  }

  async function handleNewWorkout() {
    setScreen('loading')
    try {
      const data = await getWorkoutToday()
      setWorkout(data)
      setBienestarPre(null)
      setInicioISO(null)
      setSavedEjercicios(null)
      setScreen('summary')
    } catch {
      handleLogout()
    }
  }

  if (screen === 'init' || screen === 'loading') return html`
    <div class="screen-center">
      <p style="color:var(--text-secondary)">Cargando…</p>
    </div>
  `

  if (screen === 'login') return html`<${Login} onSuccess=${handleLogin} serverError=${loginError} />`

  async function handleSelectDay(fecha) {
    setScreen('loading')
    try {
      const data = await getWorkoutToday(fecha)
      setWorkout(data)
      setScreen('summary')
    } catch (err) {
      setLoginError(err.message)
      setScreen('login')
    }
  }

  if (screen === 'summary') return html`
    <${WorkoutSummary} workout=${workout} onStart=${() => setScreen('bienestar')} onLogout=${handleLogout} onSelectDay=${handleSelectDay} />
  `

  if (screen === 'bienestar') return html`
    <${Bienestar} sugerido=${workout?.bienestarSugerido} onDone=${handleBienestarDone} onBack=${() => setScreen('summary')} />
  `

  if (screen === 'workout') return html`
    <${WorkoutScreen}
      workout=${workout}
      inicioISO=${inicioISO}
      savedEjercicios=${savedEjercicios}
      onDone=${handleWorkoutDone}
      onSave=${handleWorkoutSave}
      onLogout=${handleLogout}
    />
  `

  if (screen === 'finish') return html`
    <${FinishScreen}
      sesionData=${sesionData}
      onSubmit=${handleSubmit}
      loading=${submitLoading}
      error=${submitError}
    />
  `

  if (screen === 'confirm') return html`
    <div class="screen-center">
      <div class="login-box" style="text-align:center">
        <p style="font-size:56px">✓</p>
        <h2 style="color:var(--accent);margin:16px 0 8px">Enviado</h2>
        <p class="msg-secondary">Resumen enviado a omar.pache@gmail.com</p>
        <button class="btn-primary" style="margin-top:32px" onClick=${handleNewWorkout}>
          Volver al inicio
        </button>
      </div>
    </div>
  `

  return null
}
