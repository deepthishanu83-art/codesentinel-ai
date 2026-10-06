import { createContext, useContext, useState, useEffect } from 'react'

/**
 * AppContext — global state shared across all authenticated pages.
 */
const AppContext = createContext(null)

function loadFromStorage(key, defaultValue) {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error(`Error loading ${key} from localStorage`, error)
    return defaultValue
  }
}

export function AppProvider({ children }) {
  const [selectedRepo, setSelectedRepoState] = useState(() => loadFromStorage('selectedRepo', null))
  const [analysisResult, setAnalysisResultState] = useState(() => loadFromStorage('analysisResult', null))
  const [generatedFix, setGeneratedFix] = useState(null)
  const [validatedFix, setValidatedFix] = useState(null)
  const [selectedFinding, setSelectedFinding] = useState(null)

  const setSelectedRepo = (repo) => {
    setSelectedRepoState(repo)
    if (repo) {
      localStorage.setItem('selectedRepo', JSON.stringify(repo))
    } else {
      localStorage.removeItem('selectedRepo')
    }
  }

  const setAnalysisResult = (result) => {
    setAnalysisResultState(result)
    if (result) {
      localStorage.setItem('analysisResult', JSON.stringify(result))
    } else {
      localStorage.removeItem('analysisResult')
    }
  }

  return (
    <AppContext.Provider
      value={{
        selectedRepo, setSelectedRepo,
        analysisResult, setAnalysisResult,
        generatedFix, setGeneratedFix,
        validatedFix, setValidatedFix,
        selectedFinding, setSelectedFinding,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
