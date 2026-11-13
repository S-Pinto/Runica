import { FC, useEffect, useRef, useState } from 'react';
import { TabButton } from '../../../../components/ui/TabButton';

export interface PillTab<K extends string> {
    key: K;
    label: string;
    icon: FC<{ className?: string }>;
}

interface PillTabBarProps<K extends string> {
    tabs: PillTab<K>[];
    activeTab: K;
    onChange: (tab: K) => void;
    /** id del pulsante della tab (collegato da `aria-labelledby` del pannello). */
    tabId: (key: K) => string;
    /** id del pannello controllato dalla tab. */
    panelId: (key: K) => string;
    /** Cambia quando le etichette possono cambiare larghezza (es. un altro personaggio): rimisura l'indicatore. */
    measureKey?: string | number;
}

/**
 * Navigazione a pillola, sticky sotto l'header dell'app: unica barra di tab per
 * vista di gioco ed editor. L'indicatore `.tab-indicator` segue la voce attiva.
 */
export const PillTabBar = <K extends string>({ tabs, activeTab, onChange, tabId, panelId, measureKey }: PillTabBarProps<K>) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Indicatore scorrevole: segue la tab attiva (posizione e larghezza misurate).
    const [indicator, setIndicator] = useState<{ x: number; w: number } | null>(null);
    useEffect(() => {
        const measure = () => {
            const el = containerRef.current?.querySelector<HTMLElement>('[aria-selected="true"]');
            if (el) setIndicator({ x: el.offsetLeft, w: el.offsetWidth });
        };
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, [activeTab, measureKey]);

    useEffect(() => {
        const el = containerRef.current?.querySelector<HTMLElement>('[aria-selected="true"]');
        el?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    }, [activeTab, measureKey]);

    return (
        <nav className="sticky top-header z-40 py-2">
            <div ref={containerRef} role="tablist" aria-label="Sezioni della scheda" className="no-scrollbar relative flex gap-1 overflow-x-auto rounded-full bg-card/70 p-1 shadow-raised backdrop-blur-xl backdrop-saturate-150 sm:inline-flex sm:max-w-full">
                {indicator && <span aria-hidden className="tab-indicator" style={{ transform: `translateX(${indicator.x}px)`, width: indicator.w }} />}
                {tabs.map(tab => (
                    <TabButton
                        key={tab.key}
                        variant="pill"
                        id={tabId(tab.key)}
                        controls={panelId(tab.key)}
                        label={tab.label}
                        icon={tab.icon}
                        isActive={activeTab === tab.key}
                        onClick={() => onChange(tab.key)}
                    />
                ))}
            </div>
        </nav>
    );
};
