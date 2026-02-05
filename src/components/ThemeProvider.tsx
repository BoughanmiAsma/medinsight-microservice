import { createContext, useContext, useEffect, useState, useCallback } from "react"

type Theme = "dark" | "light" | "system" | "auto"

type ThemeProviderState = {
    theme: Theme
    setTheme: (theme: Theme) => void
    medicalMode: boolean
    setMedicalMode: (enabled: boolean) => void
    audioAlerts: boolean
    setAudioAlerts: (enabled: boolean) => void
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined)

export function ThemeProvider({
    children,
    defaultTheme = "system",
    storageKey = "osmos-theme",
    ...props
}: {
    children: React.ReactNode
    defaultTheme?: Theme
    storageKey?: string
}) {
    const [theme, setTheme] = useState<Theme>(
        () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
    )
    const [medicalMode, setMedicalMode] = useState<boolean>(
        () => localStorage.getItem("medical-mode") === "true"
    )
    const [audioAlerts, setAudioAlerts] = useState<boolean>(
        () => localStorage.getItem("audio-alerts") !== "false"
    )

    const applyTheme = useCallback((currentTheme: Theme) => {
        const root = window.document.documentElement
        root.classList.remove("light", "dark")

        if (currentTheme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
            root.classList.add(systemTheme)
        } else if (currentTheme === "auto") {
            const hour = new Date().getHours()
            const isNight = hour >= 20 || hour < 7
            root.classList.add(isNight ? "dark" : "light")
        } else {
            root.classList.add(currentTheme)
        }
    }, [])

    useEffect(() => {
        applyTheme(theme)

        // Interval to check time every minute if "auto" is active
        const timer = setInterval(() => {
            if (theme === "auto") applyTheme("auto")
        }, 60000)

        // Listener for system changes
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
        const handleSystemChange = () => {
            if (theme === "system") applyTheme("system")
        }
        mediaQuery.addEventListener("change", handleSystemChange)

        const root = window.document.documentElement
        if (medicalMode) root.classList.add("medical-filter")
        else root.classList.remove("medical-filter")

        return () => {
            clearInterval(timer)
            mediaQuery.removeEventListener("change", handleSystemChange)
        }
    }, [theme, medicalMode, applyTheme])

    const value = {
        theme,
        setTheme: (theme: Theme) => {
            localStorage.setItem(storageKey, theme)
            setTheme(theme)
        },
        medicalMode,
        setMedicalMode: (enabled: boolean) => {
            localStorage.setItem("medical-mode", String(enabled))
            setMedicalMode(enabled)
        },
        audioAlerts,
        setAudioAlerts: (enabled: boolean) => {
            localStorage.setItem("audio-alerts", String(enabled))
            setAudioAlerts(enabled)
        },
    }

    return (
        <ThemeProviderContext.Provider {...props} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext)
    if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider")
    return context
}
