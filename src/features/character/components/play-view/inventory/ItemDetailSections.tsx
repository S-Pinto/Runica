import { ReactNode } from 'react';
import { EquipmentItem } from '../../../characterTypes';
import { Button } from '../../../../../components/ui/Button';
import { ExclamationTriangleIcon } from '../../../../../components/ui/icons';
import { ABILITY_LABELS, damageTypeLabel } from '../../../../../lib/labels';
import { formatActionDamageLines, formatActionHit, type ResolvedAction } from '../../../rules/attacks';
import { formatSense } from '../../../rules/itemEffects';
import { DEFENSE_KIND_LABELS, POWER_ACTIVATION_LABELS } from '../../../utils/itemLabels';
import { playChipClass, playInsetClass, playLabelClass } from '../PlaySection';

const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

export const DetailBlock = ({ title, children }: { title: string; children: ReactNode }) => (
  <section>
    <h3 className={`${playLabelClass} mb-2`}>{title}</h3>
    {children}
  </section>
);

/** Proprietà passive: difese, bonus, sensi, lingue e avvisi. `inactive`: l'oggetto non è attivo (non equipaggiato o senza sintonia). */
export const ItemEffectsDetail = ({ item, inactive }: { item: EquipmentItem; inactive: boolean }) => {
  const e = item.effects || {};
  const bonuses = [
    item.bonusAC ? `CA ${signed(item.bonusAC)}` : '',
    e.speedBonus ? `Velocità ${signed(e.speedBonus)} ft` : '',
    e.initiativeBonus ? `Iniziativa ${signed(e.initiativeBonus)}` : '',
    ...(e.saveBonuses || []).filter(b => b.value).map(b => `${b.ability === 'all' ? 'Tiri salvezza' : `TS ${ABILITY_LABELS[b.ability]}`} ${signed(b.value)}`),
  ].filter(Boolean);
  const defenses = (e.defenses || []).filter(d => d.damageType?.trim());
  const senses = (e.senses || []).filter(s => s.name?.trim());
  const languages = (e.languages || []).map(l => l.trim()).filter(Boolean);
  const notes = (e.notes || []).map(n => n.trim()).filter(Boolean);
  if (!bonuses.length && !defenses.length && !senses.length && !languages.length && !notes.length && !item.strengthRequirement) return null;

  return (
    <DetailBlock title="Proprietà passive">
      <div className={`space-y-2 ${inactive ? 'opacity-60' : ''}`}>
        {(defenses.length > 0 || bonuses.length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {defenses.map((d, i) => (
              <span key={`d-${i}`} className={`rounded-md px-2 py-1 text-xs font-semibold ${d.kind === 'vulnerability' ? 'bg-destructive/15 text-destructive' : 'bg-accent/15 text-accent'}`}>
                {DEFENSE_KIND_LABELS[d.kind]} · {damageTypeLabel(d.damageType)}
              </span>
            ))}
            {bonuses.map(b => <span key={b} className={`${playChipClass} font-mono text-foreground`}>{b}</span>)}
          </div>
        )}
        {senses.length > 0 && <p className="text-sm text-text"><span className="text-muted-foreground">Sensi: </span>{senses.map(formatSense).join(', ')}</p>}
        {languages.length > 0 && <p className="text-sm text-text"><span className="text-muted-foreground">Lingue: </span>{languages.join(', ')}</p>}
        {item.strengthRequirement ? <p className="text-sm text-text"><span className="text-muted-foreground">Forza richiesta: </span><span className="font-mono">{item.strengthRequirement}</span></p> : null}
      </div>
      {notes.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {notes.map((n, i) => (
            <li key={i} className="flex items-start gap-2 rounded-xl bg-warning/15 px-3 py-2 text-sm text-warning">
              <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" /> {n}
            </li>
          ))}
        </ul>
      )}
    </DetailBlock>
  );
};

/** Poteri dell'oggetto già risolti (tiro, CD, danni, usi) con il pulsante per spendere un uso. */
export const ItemPowersDetail = ({ actions, item, onSpend }: { actions: ResolvedAction[]; item: EquipmentItem; onSpend?: (a: ResolvedAction) => void }) => {
  if (actions.length === 0) return null;
  return (
    <DetailBlock title="Poteri">
      <ul className="space-y-2">
        {actions.map(a => {
          const power = item.powers?.find(p => p.id === a.powerId);
          const cost = a.chargeCost ?? 1;
          const lines = formatActionDamageLines(a);
          return (
            <li key={a.id} className={`${playInsetClass} space-y-1.5 p-3`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{a.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[power?.activation && POWER_ACTIVATION_LABELS[power.activation], a.roll !== 'none' && formatActionHit(a)].filter(Boolean).join(' · ')}
                  </p>
                </div>
                {a.uses && onSpend && (
                  <Button variant="secondary" size="sm" className="h-10 shrink-0" disabled={a.uses.current < cost || a.attunementMissing} onClick={() => onSpend(a)}>
                    Usa <span className="font-mono tabular-nums">{a.uses.current}/{a.uses.max}</span>
                  </Button>
                )}
              </div>
              {lines.length > 0 && <p className="font-mono text-sm text-foreground">{lines.join(' + ')}</p>}
              {power?.description && <p className="whitespace-pre-wrap text-sm leading-relaxed text-text">{power.description}</p>}
              {a.attunementMissing && <p className="text-xs text-warning">Serve la sintonia per usarlo.</p>}
            </li>
          );
        })}
      </ul>
    </DetailBlock>
  );
};
