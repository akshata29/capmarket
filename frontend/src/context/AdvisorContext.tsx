/**
 * AdvisorContext — selectable advisor identity used across all API calls.
 *
 * Persists to localStorage so the selection survives page refreshes.
 * The active advisor ID is also kept in sync with the api module-level
 * variable via setAdvisorId(), so every API call uses the right value
 * without needing to thread the ID through props.
 */
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { setAdvisorId } from '@/api'

export interface Advisor {
  id: string
  name: string
  initials: string
  role: string
}

export const ADVISORS: Advisor[] = [
  { id: 'alex_morgan', name: 'Alex Morgan',    initials: 'AM', role: 'Senior Wealth Advisor'  },
  { id: 'jordan_lee',  name: 'Jordan Lee',     initials: 'JL', role: 'Wealth Advisor'          },
  { id: 'sam_rivera',  name: 'Sam Rivera',     initials: 'SR', role: 'Associate Advisor'       },
  { id: 'taylor_brooks', name: 'Taylor Brooks',  initials: 'TB', role: 'Private Wealth Advisor'  },
]

const STORAGE_KEY = 'capmarket_advisor_id'

function getSavedAdvisor(): Advisor {
  const saved = localStorage.getItem(STORAGE_KEY)
  return ADVISORS.find(a => a.id === saved) ?? ADVISORS[0]
}

interface AdvisorContextValue {
  advisor: Advisor
  advisors: Advisor[]
  setAdvisor: (advisor: Advisor) => void
}

const AdvisorContext = createContext<AdvisorContextValue>({
  advisor:    ADVISORS[0],
  advisors:   ADVISORS,
  setAdvisor: () => {},
})

export function AdvisorProvider({ children }: { children: ReactNode }) {
  const [advisor, setAdvisorState] = useState<Advisor>(getSavedAdvisor)

  const setAdvisor = useCallback((next: Advisor) => {
    setAdvisorState(next)
    localStorage.setItem(STORAGE_KEY, next.id)
    setAdvisorId(next.id)          // keep api module in sync immediately
  }, [])

  return (
    <AdvisorContext.Provider value={{ advisor, advisors: ADVISORS, setAdvisor }}>
      {children}
    </AdvisorContext.Provider>
  )
}

export function useAdvisor(): AdvisorContextValue {
  return useContext(AdvisorContext)
}
