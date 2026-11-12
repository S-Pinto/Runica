import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import * as puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import * as fs from 'fs';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const WEAPON_MASTERIES_DATA: any = {
  "Vex": { name: "Vex", description: "Advantage on next attack roll if hit." },
  "Sap": { name: "Sap", description: "Disadvantage on target's next attack roll if hit." },
  "Nick": { name: "Nick", description: "Extra attack of Light property part of Attack action." },
  "Cleave": { name: "Cleave", description: "Hit second creature within 5ft for ability mod damage." },
  "Graze": { name: "Graze", description: "Deal ability mod damage on miss." },
  "Push": { name: "Push", description: "Push creature up to 10 feet away." },
  "Slow": { name: "Slow", description: "Reduce target's Speed by 10 feet." },
  "Topple": { name: "Topple", description: "Force Con save or target falls Prone." },
};

const CATEGORY_LABELS: any = {
  'class': 'CLASS FEATURES',
  'racial': 'RACIAL TRAITS',
  'feat-origin': 'ORIGIN FEATS',
  'feat-general': 'GENERAL FEATS',
  'feat-combat': 'COMBAT FEATS',
  'feat-epic': 'EPIC FEATS',
};

/**
 * Main function to generate the PDF.
 */
export const generateCharacterPDF = functions
  .runWith({
    memory: '1GB',
    timeoutSeconds: 60,
  })
  .https.onCall(async (data: any, context: any) => {
    const { character } = data;

    if (!character) {
      throw new functions.https.HttpsError('invalid-argument', 'Character data is required');
    }

    try {
      const html = generateCharacterSheetHTML(character);

      const isLocal = process.env.FUNCTIONS_EMULATOR === 'true' || process.platform === 'win32';

      let launchOptions: any;
      if (isLocal) {
        // Local Windows/Emulator testing - try to find Chrome or Edge
        const paths = [
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
          'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        ];

        let executablePath = paths.find(p => fs.existsSync(p));

        launchOptions = {
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
          executablePath: executablePath || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          headless: true,
        };
      } else {
        // Cloud environment
        launchOptions = {
          args: chromium.args,
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,
        };
      }

      const browser = await puppeteer.launch(launchOptions);
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: '6mm', bottom: '6mm', left: '6mm', right: '6mm' }
      });

      await browser.close();

      return {
        success: true,
        pdf: Buffer.from(pdfBuffer).toString('base64'),
        fileName: `${character.name || 'character'}_sheet.pdf`,
      };
    } catch (error: any) {
      console.error('PDF Error:', error);
      throw new functions.https.HttpsError('internal', error.message);
    }
  });

// --- TEMPLATE GENERATORS ---

const generateCharacterSheetHTML = (character: any) => {
  const helpers = {
    safe: (v: any) => (v === null || v === undefined || String(v).trim() === '' ? '' : String(v)),
    getMod: (score: number) => Math.floor(((score || 10) - 10) / 2),
    fmtMod: (mod: number) => (mod >= 0 ? `+${mod}` : `${mod}`),
    pb: Math.ceil((character.level || 1) / 4) + 1
  };

  const svgs = renderSVGs();
  const styles = renderStyles();

  const hasSpells = character.spells && character.spells.length > 0;
  const hasCustomResources = character.customResources && character.customResources.length > 0;
  const hasCompanions = character.companions && character.companions.length > 0;

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Inter:wght@400;600;700;800&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet">
        <style>${styles}</style>
    </head>
    <body>
        <!-- PAGE 1: CORE -->
        <div class="page">
            ${renderHeader(character, helpers, svgs)}
            <div class="main-content">
                <div class="left-section">
                    ${renderProficiencyBlock(character, helpers, svgs)}
                    ${renderAbilityScores(character, helpers, svgs)}
                    ${renderLanguagesAndProfs(character, helpers)}
                </div>
                <div class="right-section">
                    ${renderVitals(character, helpers, svgs)}
                    ${renderAttacks(character, helpers)}
                    ${renderFeatures(character, helpers, svgs)}
                </div>
            </div>
        </div>

        <!-- PAGE 2: SPELLS & RESOURCES -->
        ${(hasSpells || hasCustomResources) ? `
        <div class="page page-break">
            ${renderSpellHeader(character, helpers)}
            <div class="spells-content">
                <div class="spells-left">
                    ${renderSpellSlots(character, svgs)}
                    ${renderCustomResources(character, svgs)}
                </div>
                <div class="spells-right">
                    ${renderSpellLists(character, helpers)}
                </div>
            </div>
        </div>` : ''}

        <!-- PAGE 3: INVENTORY & LORE -->
        <div class="page page-break">
            <div class="inventory-header">
                <div class="section-title">EQUIPMENT & CURRENCIES</div>
            </div>
            <div class="inventory-content">
                <div class="inv-left">
                    ${renderCurrencies(character, helpers)}
                    ${renderEquipment(character, helpers)}
                </div>
                <div class="inv-right">
                    ${renderLore(character, helpers)}
                </div>
            </div>
        </div>

        <!-- PAGE 4+: COMPANIONS -->
        ${hasCompanions ? character.companions.map((comp: any) => `
        <div class="page page-break">
            ${renderCompanionHeader(comp, helpers)}
            <div class="companion-content">
                <div class="comp-left">
                    ${renderCompanionStats(comp, helpers, svgs)}
                </div>
                <div class="comp-right">
                    ${renderCompanionActions(comp, helpers)}
                </div>
            </div>
        </div>
        `).join('') : ''}
    </body>
    </html>
    `;
};

// --- MODULAR RENDER FUNCTIONS ---

function renderHeader(char: any, h: any, svgs: any) {
  return `
    <header class="char-header">
        <div class="portrait-container">
            ${char.imageUrl ? `<img src="${char.imageUrl}" class="portrait-img" />` : `<div class="portrait-placeholder">${svgs.portraitFrame}</div>`}
        </div>
        <div class="header-info">
            <div class="name-level-row">
                <div class="header-field name-field">
                    <div class="field-value">${h.safe(char.name)}</div>
                    <div class="field-label">CHARACTER NAME</div>
                </div>
                <div class="level-badge">
                    <div class="lvl-label">LVL</div>
                    <div class="lvl-val">${char.level || 1}</div>
                </div>
            </div>
            <div class="meta-row">
                <div class="header-field">
                    <div class="field-value">${h.safe(char.class)}</div>
                    <div class="field-label">CLASS</div>
                </div>
                <div class="header-field">
                    <div class="field-value">${h.safe(char.background)}</div>
                </div>
                <div class="header-field">
                    <div class="field-value">${h.safe(char.race || char.species)}</div>
                </div>
                <div class="header-field">
                    <div class="field-value">${h.safe(char.alignment)}</div>
                </div>
            </div>
        </div>
    </header>
    `;
}

function renderProficiencyBlock(char: any, h: any, svgs: any) {
  return `
    <div class="pb-container-v15">
        <div class="pb-svg-frame">${svgs.pbFrame}</div>
        <div class="pb-badge-v15">
            <div class="pb-label-v15">PROFICIENCY</div>
            <div class="pb-value-v15">${h.fmtMod(h.pb)}</div>
            <div class="pb-label-v15">BONUS</div>
        </div>
    </div>
    `;
}

function renderLanguagesAndProfs(char: any, h: any) {
  return `
    <div class="section-card lang-prof" style="margin-top: 3.5mm">
        <div class="section-title">PROFICIENCIES & LANGUAGES</div>
        <div class="small-text">
            ${(char.proficiencies || []).join(', ') || 'None'}
            ${char.languages ? `<br><br><b>Languages:</b> ${char.languages}` : ''}
        </div>
    </div>
    `;
}

function renderAbilityScores(char: any, h: any, svgs: any) {
  const abilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
  const labels: any = {
    strength: 'STRENGTH', dexterity: 'DEXTERITY', constitution: 'CONSTITUTION',
    intelligence: 'INTELLIGENCE', wisdom: 'WISDOM', charisma: 'CHARISMA'
  };

  const skillsByAbility: any = {
    strength: ['Athletics'],
    dexterity: ['Acrobatics', 'Sleight of Hand', 'Stealth'],
    constitution: [],
    intelligence: ['Arcana', 'History', 'Investigation', 'Nature', 'Religion'],
    wisdom: ['Animal Handling', 'Insight', 'Medicine', 'Perception', 'Survival'],
    charisma: ['Deception', 'Intimidation', 'Performance', 'Persuasion']
  };

  return `
    <div class="abilities-vertical">
        ${abilities.map(key => {
    const score = char.abilityScores?.[key] || 10;
    const mod = h.getMod(score);
    const saveProf = char.savingThrows?.[key]?.proficient;
    const saveVal = mod + (saveProf ? h.pb : 0);

    const skillsHTML = skillsByAbility[key].map((sName: string) => {
      const sObj = (char.skills || []).find((s: any) => s.name === sName);
      const isProf = sObj?.proficient;
      const isExp = sObj?.expertise;
      const val = mod + (isProf ? h.pb : 0) + (isExp ? h.pb : 0);
      return `
                <div class="skill-row">
                    <div class="prof-indicator ${isProf ? 'filled' : ''}"></div>
                    <span class="skill-val">${h.fmtMod(val)}</span>
                    <span class="skill-name-v8">${sName}</span>
                </div>
                `;
    }).join('');

    return `
            <div class="ability-card-v9">
                <div class="ability-label-v9">${labels[key]}</div>
                <div class="ability-body-v9">
                    <div class="ability-header-v9">
                        <div class="mod-container-v9">
                            ${svgs.modFrame}
                            <div class="mod-value-v9">${h.fmtMod(mod)}</div>
                        </div>
                        <div class="score-bubble-v9">
                            <div class="score-val-v9">${score}</div>
                        </div>
                    </div>
                    <div class="ability-details-v9">
                        <div class="save-row-v9">
                            <div class="prof-indicator ${saveProf ? 'filled' : ''}"></div>
                            <span class="save-val-v9">${h.fmtMod(saveVal)}</span>
                            <span class="save-label-v9">SAVING THROW</span>
                        </div>
                        <div class="skills-list-v9">${skillsHTML}</div>
                    </div>
                </div>
            </div>
            `;
  }).join('')}
    </div>
    `;
}

function renderVitals(char: any, h: any, svgs: any) {
  const dexMod = h.getMod(char.abilityScores?.dexterity || 10);
  const wisMod = h.getMod(char.abilityScores?.wisdom || 10);
  const isPerceptionProf = char.skills?.find((s: any) => s.name === 'Perception')?.proficient;
  const passivePerc = 10 + wisMod + (isPerceptionProf ? h.pb : 0);
  const lvl = char.level || 1;

  return `
    <div class="vitals-row">
        <div class="vital-card ac-card">
            <div class="vital-label">ARMOR CLASS</div>
            <div class="shield-container">
                ${svgs.shield}
                <div class="vital-value">${char.armorClass || (10 + dexMod)}</div>
            </div>
        </div>
        <div class="vital-card">
            <div class="vital-label">INITIATIVE</div>
            <div class="vital-value-frame">${h.fmtMod(dexMod)}</div>
        </div>
        <div class="vital-card">
            <div class="vital-label">SPEED</div>
            <div class="vital-value-frame">${char.speed || 30}ft</div>
        </div>
        <div class="vital-card">
            <div class="vital-label">PASSIVE PERC.</div>
            <div class="vital-value-frame">${passivePerc}</div>
        </div>
    </div>
    
    <div class="hp-vitals-container">
        <div class="hp-row">
            <div class="hp-box current-hp">
                <div class="box-label">CURRENT HIT POINTS</div>
                <div class="box-value-empty"></div>
            </div>
            <div class="hp-box max-hp">
                <div class="box-label">MAX HIT POINTS</div>
                <div class="box-value">${char.hp?.max || 0}</div>
            </div>
            <div class="hp-box temp-hp">
                <div class="box-label">TEMP HIT POINTS</div>
                <div class="box-value-empty"></div>
            </div>
        </div>
        <div class="vitals-lower-row">
            <div class="vital-box hit-dice">
                <div class="box-label">HIT DICE</div>
                <div class="hd-val">${char.hitDice?.total || ''}</div>
                <div class="hd-dots-grid">
                    ${svgs.dot.repeat(lvl)}
                </div>
            </div>
            <div class="vital-box death-saves">
                <div class="box-label">DEATH SAVES</div>
                <div class="ds-container">
                    <div class="ds-row">SUCC ${svgs.diamond}${svgs.diamond}${svgs.diamond}</div>
                    <div class="ds-row">FAIL ${svgs.diamond}${svgs.diamond}${svgs.diamond}</div>
                </div>
            </div>
        </div>
    </div>
    `;
}

function getActions(char: any, h: any) {
  const actions: any[] = [];
  if (!char) return actions;

  const getAbilityMod = (ability?: string) => {
    const score = char.abilityScores[ability as keyof typeof char.abilityScores] || 10;
    return Math.floor((score - 10) / 2);
  };

  const calculateSpellSaveDC = () => {
    if (!char.spellcastingAbility) return 8 + h.pb;
    const mod = getAbilityMod(char.spellcastingAbility);
    return 8 + h.pb + mod;
  };

  const calculateSpellAttackBonus = () => {
    if (!char.spellcastingAbility) return h.pb;
    const mod = getAbilityMod(char.spellcastingAbility);
    return h.pb + mod;
  };

  const formatDamage = (baseDamage: string, type: string, abilityKey: string, extra: any[]) => {
    const mod = abilityKey ? getAbilityMod(abilityKey) : 0;
    let parts = [`${baseDamage}${mod !== 0 ? (mod > 0 ? `+${mod}` : mod) : ''} ${type || ''}`.trim()];
    if (extra && extra.length > 0) {
      extra.forEach(e => parts.push(`${e.formula} ${e.type}`));
    }
    return parts.join(' + ');
  };

  // 1. Equipped Weapons
  (char.equipment || []).filter((i: any) => i.equipped && i.armorType === 'weapon').forEach((weapon: any) => {
    const magicBonus = (weapon.armorClass || 0);
    const abilityMod = getAbilityMod(weapon.attackAbility || 'strength');
    const totalHit = abilityMod + (weapon.isProficient ? h.pb : 0) + magicBonus;

    let notes = weapon.mastery ? `<b>${weapon.mastery}</b>` : '';
    if (weapon.mastery && WEAPON_MASTERIES_DATA[weapon.mastery]) {
      notes += `: ${WEAPON_MASTERIES_DATA[weapon.mastery].description}`;
    }

    actions.push({
      name: weapon.name,
      bonus: totalHit >= 0 ? `+${totalHit}` : `${totalHit}`,
      damageMarkup: formatDamage(weapon.damage || '1d4', weapon.damageType, weapon.damageAbility, weapon.additionalDamage),
      propertiesMarkup: (weapon.properties || []).map((p: string) => `<i>${p}</i>`).join(', '),
      notesMarkup: notes,
      uses: weapon.uses
    });
  });

  // 2. Cantrips
  (char.spells || []).filter((s: any) => s.level === 0 && s.damage).forEach((spell: any) => {
    const bonus = calculateSpellAttackBonus();
    const dc = calculateSpellSaveDC();
    actions.push({
      name: spell.name,
      bonus: spell.saveAbility ? `DC ${dc}` : (bonus >= 0 ? `+${bonus}` : `${bonus}`),
      damageMarkup: formatDamage(spell.damage, spell.damageType, '', []),
      propertiesMarkup: 'Cantrip',
      notesMarkup: '',
      uses: spell.uses
    });
  });

  // 3. Action Features
  (char.featuresAndTraits || []).filter((f: any) => f.isAction).forEach((feat: any) => {
    actions.push({
      name: feat.name,
      bonus: '---',
      damageMarkup: 'Special',
      propertiesMarkup: 'Feature',
      notesMarkup: feat.recovery ? `Recharge: ${feat.recovery}` : '',
      uses: feat.uses
    });
  });

  return actions;
}

function renderAttacks(char: any, h: any) {
  const actions = getActions(char, h);
  const rows = actions.map((atk: any) => `
        <tr>
            <td class="font-serif"><b>${h.safe(atk.name)}</b></td>
            <td class="center"><b>${h.safe(atk.bonus)}</b></td>
            <td class="small-text"><b>${atk.damageMarkup}</b></td>
            <td class="small-text">${atk.propertiesMarkup}</td>
            <td class="notes-cell">${atk.notesMarkup}</td>
        </tr>
    `).join('');

  return `
    <div class="section-card attacks">
        <div class="section-title">ATTACKS & SPELLCASTING</div>
        <table class="grid-table">
            <thead>
                <tr>
                    <th style="width: 21%">NAME</th>
                    <th style="width: 10%">HIT/DC</th>
                    <th style="width: 23%">DAMAGE/TYPE</th>
                    <th style="width: 18%">PROPERTIES</th>
                    <th style="width: 28%">MASTERY/NOTES</th>
                </tr>
            </thead>
            <tbody>
                ${rows || '<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>'}
                ${'<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>'.repeat(Math.max(0, 4 - actions.length))}
            </tbody>
        </table>
    </div>
    `;
}

function renderFeatures(char: any, h: any, svgs: any) {
  const features = char.featuresAndTraits || [];
  const grouped = features.reduce((acc: any, f: any) => {
    const cat = f.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(f);
    return acc;
  }, {});

  const categories = ['class', 'racial', 'feat-origin', 'feat-general', 'feat-combat', 'feat-epic', 'other'];

  return `
    <div class="section-card features">
        <div class="section-title">FEATURES & TRAITS</div>
        <div class="features-container">
            ${categories.map(cat => {
    const list = grouped[cat];
    if (!list || list.length === 0) return '';
    return `
                <div class="feature-group">
                    <div class="group-label">${CATEGORY_LABELS[cat] || 'OTHER FEATURES'}</div>
                    ${list.map((f: any) => {
      let tracker = '';
      if (f.uses && f.uses.max > 0) {
        tracker = `<div class="feature-tracker">${svgs.diamond.repeat(f.uses.max)}</div>`;
      }
      return `
                        <div class="feature-item-v14">
                            <div class="feat-header">
                                <span class="font-serif feat-name">${h.safe(f.name)}</span>
                                ${f.recovery ? `<span class="feat-recovery">Recover: ${f.recovery === 'short' ? 'Short Rest' : 'Long Rest'}</span>` : ''}
                            </div>
                            <div class="feat-desc">${h.safe(f.description)}</div>
                            ${tracker}
                        </div>
                        `;
    }).join('')}
                </div>
                `;
  }).join('')}
        </div>
    </div>
    `;
}

function renderSpellHeader(char: any, h: any) {
  const ability = char.spellcastingAbility || 'intelligence';
  const mod = h.getMod(char.abilityScores?.[ability] || 10);
  return `
    <header class="spell-header-card">
        <div class="spell-field"><div class="field-val">${h.safe(char.class)}</div><div class="field-lab">CLASS</div></div>
        <div class="spell-field"><div class="field-val">${ability.toUpperCase()}</div><div class="field-lab">ABILITY</div></div>
        <div class="spell-field"><div class="field-val">${8 + h.pb + mod}</div><div class="field-lab">SAVE DC</div></div>
        <div class="spell-field"><div class="field-val">${h.fmtMod(h.pb + mod)}</div><div class="field-lab">BONUS</div></div>
    </header>
    `;
}

function renderSpellSlots(char: any, svgs: any) {
  return `
    <div class="spell-slots-card">
        <div class="section-title">SPELL SLOTS</div>
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(lv => {
    const max = char.spellSlots?.[lv]?.max || 0;
    if (max === 0) return '';
    return `
            <div class="slot-row">
                <div class="lvl-label">${lv}</div>
                <div class="slot-diamonds">${svgs.diamond.repeat(max)}</div>
            </div>`;
  }).join('')}
    </div>
    `;
}

function renderCustomResources(char: any, svgs: any) {
  const resources = char.customResources || [];
  if (resources.length === 0) return '';
  return `
    <div class="custom-res-card" style="margin-top: 6mm">
        <div class="section-title">CUSTOM RESOURCES</div>
        ${resources.map((res: any) => `
            <div class="res-row">
                <div class="res-name-tracker">
                    <span class="font-serif res-name">${res.name}</span>
                    <div class="res-tracker">${svgs.diamond.repeat(res.max)}</div>
                </div>
            </div>
        `).join('')}
    </div>
  `;
}

function renderSpellLists(char: any, h: any) {
  const spells = [...(char.spells || [])].sort((a, b) => (a.level || 0) - (b.level || 0));
  if (spells.length === 0) return '';

  return `
    <div class="spell-lists">
        <div class="section-card">
            <div class="section-title">CANTRIPS & SPELLS</div>
            <table class="spell-detail-table">
                <thead>
                    <tr>
                        <th style="width: 5%">LVL</th>
                        <th style="width: 30%">NAME</th>
                        <th style="width: 20%">TIME</th>
                        <th style="width: 20%">RANGE</th>
                        <th style="width: 25%">DURATION/COMP</th>
                    </tr>
                </thead>
                <tbody>
                ${spells.map((s: any) => `
                    <tr class="spell-main-row">
                        <td class="lv-cell">${s.level}</td>
                        <td class="font-serif"><b>${h.safe(s.name)}</b></td>
                        <td class="small-text">${h.safe(s.castingTime)}</td>
                        <td class="small-text">${h.safe(s.range)}</td>
                        <td class="small-text">${h.safe(s.duration)}${s.components ? ` (${s.components})` : ''}</td>
                    </tr>
                    <tr class="spell-desc-row">
                        <td colspan="5" class="spell-desc-cell">${h.safe(s.description)}</td>
                    </tr>
                `).join('')}
                </tbody>
            </table>
        </div>
    </div>
    `;
}

function renderCurrencies(char: any, h: any) {
  const c = char.currency || { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };
  return `
    <div class="currency-card">
        <div class="curr-box"><div class="curr-val">${c.cp || 0}</div><div class="curr-lab">CP</div></div>
        <div class="curr-box"><div class="curr-val">${c.sp || 0}</div><div class="curr-lab">SP</div></div>
        <div class="curr-box"><div class="curr-val">${c.ep || 0}</div><div class="curr-lab">EP</div></div>
        <div class="curr-box"><div class="curr-val">${c.gp || 0}</div><div class="curr-lab">GP</div></div>
        <div class="curr-box"><div class="curr-val">${c.pp || 0}</div><div class="curr-lab">PP</div></div>
    </div>
  `;
}

function renderEquipment(char: any, h: any) {
  const equip = char.equipment || [];
  return `
    <div class="equipment-list">
        <table class="equip-table">
            <thead>
                <tr>
                    <th style="width: 8%">QTY</th>
                    <th style="width: 30%">ITEM NAME</th>
                    <th style="width: 62%">DESCRIPTION/NOTES</th>
                </tr>
            </thead>
            <tbody>
                ${equip.map((i: any) => `
                    <tr>
                        <td class="center">${i.quantity || 1}</td>
                        <td class="font-serif"><b>${h.safe(i.name)}</b></td>
                        <td class="small-text">${h.safe(i.description)}</td>
                    </tr>
                `).join('')}
                ${'<tr><td>&nbsp;</td><td></td><td></td></tr>'.repeat(Math.max(0, 15 - equip.length))}
            </tbody>
        </table>
    </div>
  `;
}

function renderLore(char: any, h: any) {
  return `
    <div class="lore-section">
        <div class="attribute-block">
            <div class="block-label">PERSONALITY TRAITS</div>
            <div class="block-value">${h.safe(char.personalityTraits)}</div>
        </div>
        <div class="attribute-block">
            <div class="block-label">IDEALS</div>
            <div class="block-value">${h.safe(char.ideals)}</div>
        </div>
        <div class="attribute-block">
            <div class="block-label">BONDS</div>
            <div class="block-value">${h.safe(char.bonds)}</div>
        </div>
        <div class="attribute-block">
            <div class="block-label">FLAWS</div>
            <div class="block-value">${h.safe(char.flaws)}</div>
        </div>
        <div class="biography-block">
            <div class="section-title">CHARACTER BACKSTORY</div>
            <div class="bio-text">${h.safe(char.biography)}</div>
        </div>
    </div>
  `;
}

function renderCompanionHeader(comp: any, h: any) {
  return `
    <header class="companion-header">
        <div class="section-title">COMPANION / SUMMON</div>
        <div class="comp-name-row">
            <div class="comp-name font-serif">${h.safe(comp.name)}</div>
            <div class="comp-type">${h.safe(comp.type)}</div>
        </div>
    </header>
  `;
}

function renderCompanionStats(comp: any, h: any, svgs: any) {
  const abilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

  return `
    <div class="comp-vitals">
        <div class="comp-vital-box">
            <div class="box-label">ARMOR CLASS</div>
            <div class="box-value">${comp.armorClass || 10}</div>
        </div>
        <div class="comp-vital-box">
            <div class="box-label">HIT POINTS</div>
            <div class="box-value">${comp.hp?.max || 0}</div>
        </div>
        <div class="comp-vital-box">
            <div class="box-label">SPEED</div>
            <div class="box-value">${comp.speed || '30ft'}</div>
        </div>
    </div>
    <div class="comp-abilities">
        ${abilities.map(key => {
    const score = comp.abilityScores?.[key] || 10;
    const mod = h.getMod(score);
    return `
            <div class="comp-ability">
                <div class="ab-lab">${key.substring(0, 3).toUpperCase()}</div>
                <div class="ab-val">${score} (${h.fmtMod(mod)})</div>
            </div>
          `;
  }).join('')}
    </div>
  `;
}

function renderCompanionActions(comp: any, h: any) {
  const attacks = comp.attacks || [];
  const features = comp.featuresAndTraits || [];

  return `
    <div class="comp-actions">
        <div class="section-title">ACTIONS & TRAITS</div>
        ${attacks.map((atk: any) => `
            <div class="comp-action-item">
                <b>${h.safe(atk.name)}.</b> ${atk.bonus ? `<i>Hit:</i> ${atk.bonus}. ` : ''} <i>Damage:</i> ${atk.damage}. ${atk.properties ? `(${atk.properties.join(', ')})` : ''}
            </div>
        `).join('')}
        ${features.map((f: any) => `
            <div class="comp-action-item">
                <b>${h.safe(f.name)}.</b> ${h.safe(f.description)}
            </div>
        `).join('')}
        <div class="comp-notes">
            <div class="block-label">NOTES</div>
            <div class="small-text">${h.safe(comp.notes)}</div>
        </div>
    </div>
  `;
}

function renderSVGs() {
  return {
    shield: `<svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg"><path d="M50 0 L100 15 L100 60 C100 95 50 120 50 120 C50 120 0 95 0 60 L0 15 Z" fill="#f5f5f5" stroke="black" stroke-width="4"/></svg>`,
    portraitFrame: `<svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="90" height="110" rx="10" fill="#eee" stroke="#ccc" stroke-width="2"/></svg>`,
    modFrame: `<svg viewBox="0 0 80 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;"><path d="M10 0 L70 0 Q80 0 80 10 L80 90 Q80 100 70 100 L10 100 Q0 100 0 90 L0 10 Q0 0 10 0" fill="#f9f9f9" stroke="black" stroke-width="2"/></svg>`,
    diamond: `<svg viewBox="0 0 20 20" style="width:2.8mm;height:2.8mm;margin:0.2mm;"><rect x="4" y="4" width="12" height="12" fill="none" stroke="black" stroke-width="2" transform="rotate(45 10 10)"/></svg>`,
    dot: `<svg viewBox="0 0 20 20" style="width:3.2mm;height:3.2mm;margin:0.2mm;"><circle cx="10" cy="10" r="7" fill="none" stroke="black" stroke-width="2"/></svg>`,
    pbFrame: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="48" fill="#f9f9f9" stroke="black" stroke-width="2" /><circle cx="50" cy="50" r="42" fill="none" stroke="black" stroke-width="1" stroke-dasharray="2,2" /></svg>`
  };
}

function renderStyles() {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; font-size: 8pt; color: #000; background: #fff; }
    .page { width: 210mm; height: 297mm; padding: 10mm; position: relative; overflow: hidden; page-break-after: always; }
    .page-break { page-break-before: always; }
    
    .font-serif { font-family: 'Libre Baskerville', serif; }
    .center { text-align: center; }
    .small-text { font-size: 7pt; line-height: 1.2; }
    
    /* HEADER */
    .char-header { display: flex; gap: 6mm; margin-bottom: 6mm; align-items: flex-end; }
    .portrait-container { width: 32mm; height: 42mm; border: 2px solid #000; border-radius: 4px; overflow: hidden; background: #f9f9f9; flex-shrink: 0; }
    .name-level-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2mm; }
    .name-field { flex: 1; border-bottom: 2px solid #000; padding-bottom: 1mm; }
    .name-field .field-value { font-family: 'Playfair Display', serif; font-size: 26pt; font-weight: 900; line-height: 1; }
    .level-badge { background: #000; border-radius: 4px; padding: 2mm 5mm; color: #fff; text-align: center; box-shadow: 2px 2px 0 #bbb; margin-left: 4mm; }
    .lvl-val { font-family: 'Libre Baskerville', serif; font-size: 20pt; font-weight: 700; }
    .meta-row { display: flex; gap: 4mm; margin-top: 2mm; border-bottom: 1.5px solid #000; padding-bottom: 1.5mm; }
    .header-field { flex: 1; display: flex; flex-direction: column-reverse; }
    .meta-row .field-value { font-family: 'Libre Baskerville', serif; font-size: 10pt; font-weight: 700; text-transform: uppercase; }
    .field-label { font-size: 6pt; font-weight: 900; color: #666; text-transform: uppercase; margin-top: 0.5mm; }

    /* LAYOUT */
    .main-content { display: grid; grid-template-columns: 55mm 1fr; gap: 6mm; }
    
    /* PB BADGE */
    .pb-container-v15 { position: relative; width: 22mm; height: 22mm; margin: 0 auto 4mm; display: flex; align-items: center; justify-content: center; }
    .pb-badge-v15 { position: relative; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 2; }
    .pb-value-v15 { font-family: 'Libre Baskerville', serif; font-size: 18pt; font-weight: 900; line-height: 1; margin-top: 1mm; }
    .pb-label-v15 { font-size: 5pt; font-weight: 950; color: #666; text-transform: uppercase; letter-spacing: 0.2pt; }
    .pb-svg-frame { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; }

    /* ABILITIES */
    .ability-card-v9 { border: 2px solid #000; border-radius: 4px; padding: 1mm; background: #fff; margin-bottom: 2mm; }
    .ability-label-v9 { font-size: 6.5pt; font-weight: 950; margin-bottom: 1mm; border-bottom: 1px solid #ddd; padding-bottom: 0.5mm; }
    .ability-body-v9 { display: flex; gap: 2.5mm; }
    .mod-container-v9 { position: relative; width: 14mm; height: 16mm; flex-shrink: 0; }
    .mod-value-v9 { position: absolute; top: 48%; left: 50%; transform: translate(-50%, -50%); font-family: 'Libre Baskerville', serif; font-size: 15pt; font-weight: 900; }
    .score-bubble-v9 { position: absolute; bottom: -1mm; background: #fff; border: 1.5px solid #000; border-radius: 10px; padding: 0.2mm 1.5mm; min-width: 9mm; text-align: center; left: 50%; transform: translateX(-50%); }

    /* HP & VITALS */
    .vitals-row { display: flex; gap: 2.5mm; margin-bottom: 3.5mm; }
    .vital-card { flex: 1; border: 2px solid #000; border-radius: 4px; padding: 1.5mm; text-align: center; }
    .hp-vitals-container { display: flex; flex-direction: column; gap: 3mm; margin-bottom: 3.5mm; }
    .hp-row { display: flex; gap: 3mm; }
    .hp-box { flex: 1; border: 2px solid #000; border-radius: 4px; padding: 1.5mm; text-align: center; }
    .vital-box { flex: 1; border: 2px solid #000; border-radius: 4px; padding: 1.5mm; text-align: center; }

    /* ATTACKS */
    .section-card { border: 2px solid #000; border-radius: 4px; padding: 2.5mm; margin-bottom: 4mm; }
    .section-title { font-weight: 900; font-size: 7.5pt; background: #000; color: #fff; padding: 0.8mm 1.2mm; border-radius: 2px; margin-bottom: 2mm; text-transform: uppercase; }
    .grid-table { width: 100%; border-collapse: collapse; }
    .grid-table th { text-align: left; font-size: 5.2pt; font-weight: 950; color: #666; border-bottom: 1px solid #000; }
    .grid-table td { padding: 1.8mm 0.5mm; border-bottom: 1px solid #eee; font-size: 7.2pt; vertical-align: top; }
    .notes-cell { font-size: 6.2pt; color: #444; line-height: 1.1; padding-top: 2mm !important; }

    /* FEATURES */
    .features-container { column-count: 2; column-gap: 4mm; column-fill: auto; }
    .feature-group { break-inside: avoid; margin-bottom: 4mm; }
    .group-label { font-size: 6pt; font-weight: 950; color: #666; letter-spacing: 0.4pt; border-bottom: 1.2px solid #000; padding-bottom: 0.5mm; margin-bottom: 1.5mm; }
    .feature-item-v14 { margin-bottom: 2.5mm; }
    .feat-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.2mm; }
    .feat-name { font-weight: 750; font-size: 7.8pt; color: #000; }
    .feat-recovery { font-size: 5.8pt; font-weight: 850; color: #666; text-transform: uppercase; }
    .feat-desc { font-size: 7pt; line-height: 1.2; color: #333; }
    .feature-tracker { display: flex; flex-wrap: wrap; gap: 0.5mm; margin-top: 1mm; }

    /* SPELLS PAGE */
    .spell-header-card { display: flex; gap: 4mm; border: 2px solid #000; border-radius: 4px; padding: 3mm; margin-bottom: 6mm; background: #f9f9f9; }
    .spell-field { flex: 1; text-align: center; border-right: 1px solid #ddd; }
    .spell-field:last-child { border-right: none; }
    .field-lab { font-size: 6pt; font-weight: 900; color: #666; margin-top: 1mm; }
    .field-val { font-family: 'Libre Baskerville'; font-size: 14pt; font-weight: 900; }
    .spells-content { display: grid; grid-template-columns: 50mm 1fr; gap: 6mm; }
    .slot-row { display: flex; align-items: center; gap: 3mm; margin-bottom: 2mm; padding: 1mm; border-bottom: 1px solid #eee; }
    .slot-diamonds { display: flex; gap: 1mm; }
    .spell-detail-table { width: 100%; border-collapse: collapse; }
    .spell-detail-table th { text-align: left; font-size: 5.5pt; font-weight: 950; color: #666; border-bottom: 1px solid #000; padding-bottom: 1mm; }
    .spell-main-row td { padding: 1.5mm 0.5mm 0.5mm 0.5mm; font-size: 7.5pt; vertical-align: top; }
    .spell-desc-row td { padding: 0.5mm 0.5mm 2.5mm 0.5mm; border-bottom: 1px solid #eee; }
    .spell-desc-cell { font-size: 6.5pt; line-height: 1.1; color: #444; }
    .lv-cell { background: #000; color: #fff; text-align: center; border-radius: 2px; font-weight: 900; font-size: 6.5pt; width: 6mm; height: 5mm; display: inline-flex; align-items: center; justify-content: center; }

    /* PAGE 3: INVENTORY & LORE */
    .inventory-content { display: grid; grid-template-columns: 105mm 1fr; gap: 8mm; margin-top: 4mm; }
    .currency-card { display: flex; gap: 2mm; margin-bottom: 4mm; }
    .curr-box { flex: 1; border: 2px solid #000; border-radius: 4px; padding: 2mm; text-align: center; background: #f9f9f9; }
    .curr-val { font-family: 'Libre Baskerville'; font-size: 12pt; font-weight: 900; }
    .curr-lab { font-size: 6pt; font-weight: 900; color: #666; }
    .equip-table { width: 100%; border-collapse: collapse; border: 2px solid #000; }
    .equip-table th { background: #eee; font-size: 6pt; font-weight: 950; padding: 1mm; border: 1px solid #000; }
    .equip-table td { padding: 1.5mm 1mm; border: 1px solid #000; font-size: 7.5pt; vertical-align: top; }
    .attribute-block { border: 1.5px solid #000; border-radius: 4px; padding: 2mm; margin-bottom: 4mm; }
    .block-label { font-size: 6pt; font-weight: 950; color: #666; margin-bottom: 1.5mm; border-bottom: 1px solid #ddd; }
    .block-value { font-size: 7.5pt; line-height: 1.3; font-style: italic; }
    .biography-block { margin-top: 6mm; }
    .bio-text { font-size: 8pt; line-height: 1.5; white-space: pre-wrap; margin-top: 2mm; color: #111; }

    /* COMPANIONS */
    .companion-header { margin-bottom: 6mm; border-bottom: 2px solid #000; padding-bottom: 2mm; }
    .comp-name-row { display: flex; justify-content: space-between; align-items: baseline; margin-top: 2mm; }
    .comp-name { font-size: 20pt; font-weight: 900; color: #000; }
    .comp-type { font-size: 12pt; font-weight: 700; color: #666; font-style: italic; }
    .companion-content { display: grid; grid-template-columns: 60mm 1fr; gap: 8mm; }
    .comp-vitals { display: flex; gap: 3mm; margin-bottom: 4mm; }
    .comp-vital-box { flex: 1; border: 2px solid #000; border-radius: 4px; padding: 2mm; text-align: center; background: #f9f9f9; }
    .comp-abilities { display: grid; grid-template-columns: 1fr 1fr; gap: 2mm; margin-bottom: 6mm; }
    .comp-ability { border: 1px solid #000; padding: 1mm; display: flex; justify-content: space-between; font-size: 7pt; }
    .ab-lab { font-weight: 900; color: #666; }
    .comp-action-item { margin-bottom: 3mm; line-height: 1.3; font-size: 7.5pt; }
    .comp-notes { margin-top: 6mm; border-top: 1px solid #000; padding-top: 2mm; }
    `;
}
