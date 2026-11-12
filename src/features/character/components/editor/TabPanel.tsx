import React from 'react';

interface TabPanelProps {
    tabKey: string;
    activeTab: string;
    className?: string;
    children: React.ReactNode;
}

/** Contenitore ARIA di un pannello dell'editor: resta montato ma nascosto quando il tab non è attivo. */
export const TabPanel = ({ tabKey, activeTab, className, children }: TabPanelProps) => (
    <div id={`panel-${tabKey}`} role="tabpanel" aria-labelledby={`tab-${tabKey}`} hidden={activeTab !== tabKey} className={className}>
        {children}
    </div>
);
