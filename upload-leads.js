// === Beulah leads bulk upload ===
// HOW TO RUN:
//   1. Open https://aspengineering.github.io/beulah-dashboard/ and sign in.
//   2. Open DevTools (F12 or Cmd+Opt+I) → Console tab.
//   3. Paste this entire file and press Enter.
//   4. Wait ~5 seconds. You'll see "DONE: inserted N leads, M activity entries."
//   5. Refresh the page.

(async () => {
  if (typeof sb === 'undefined') {
    console.error('sb client not found. Make sure you are logged into the Beulah dashboard tab before running this.');
    return;
  }
  const { data: u } = await sb.auth.getUser();
  if (!u?.user) { console.error('Not signed in. Sign in first.'); return; }
  const owner_id = u.user.id;

  // Today's date anchor: 2026-05-05
  // Helper to make a date N days before/after today at a reasonable time.
  const day = (offset, hour = 14, minute = 0) => {
    const d = new Date('2026-05-05T12:00:00');
    d.setDate(d.getDate() + offset);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  };

  const LEADS = [
    {
      name: 'SOMACRM',
      company: 'SOMACRM',
      stage: 'Negotiating',
      notes:
        'Lengyel cég, árbevétel ismeretlen, de nagyobb cégnek tűnik – networking eventekről jött le, és több ilyen eseményt is támogat.\n\n' +
        'Érték: 2–4M Ft + addon, ÁFA · 5 projekt · Állami projekt: még nem tudni\n\n' +
        'Mellékszál: a menedzser, akivel Ádám korábban beszélt, már a számlázásnál tart egy másik projekttel – csak a számlát kell kiküldeni.',
      activity: [
        { kind: 'meeting', body: 'TP1: Beszélt a projektmenedzserrel. (20–25 perc)', at: day(-70) },
        { kind: 'call',    body: 'TP2: Beszélt a CEO-val. (15 perc)',                 at: day(-55) },
        { kind: 'email',   body: 'TP3: Elküldte a projekteket, a CEO konkrét javításokkal és extra igényekkel válaszolt.', at: day(-45) },
        { kind: 'call',    body: 'TP4: Elküldte a javításokat, felhívta – mondta, hogy megnézi. (10–20 perc)', at: day(-38) },
        { kind: 'call',    body: 'TP5: Telefonos megbeszélés, sokat beszélt egy állami projektről (hadsereg stb.) és a SOMACRM-ről. (10–20 perc)', at: day(-30) },
        { kind: 'call',    body: 'TP6: Rákövetkező héten felhívta, a CEO mondta, hogy aznap elküld mindent, amit szeretne – el is küldte. (1–2 perc)', at: day(-22) },
        { kind: 'call',    body: 'TP7: Hétfőn felhívta, beszéltek az állami projektről, jövő keddre Zoom-megbeszélést egyeztettek le. (10–15 perc)', at: day(-1) },
        { kind: 'meeting', body: 'Zoom-megbeszélés a CEO-val (folytatás)', at: day(7, 15, 0) },
      ],
      todos: [
        'Felkészülés a jövő keddi Zoom-megbeszélésre',
        'Számla kiküldése a mellékszál projekthez',
      ],
    },

    {
      name: 'MotorEasy (Motokiki)',
      company: 'MotorEasy',
      stage: 'Proposal',
      notes:
        'UK-székhelyű (Reading), magánkézben lévő járművédelmi és karbantartási cég. ~60–83 fő, éves bevétel: ~$7,7M.\n\n' +
        'Kontakt: Duncan (CEO).\n\n' +
        'Érték: $10k–$25k (3–7,7M Ft) + addon, ÁFA',
      activity: [
        { kind: 'call',  body: 'TP1: Sales – Hideg hívás.',                                                                  at: day(-50) },
        { kind: 'email', body: 'TP2: E-mailt küldtünk, Duncan (CEO) visszaírt: több infót kér.',                              at: day(-42) },
        { kind: 'call',  body: 'TP3: Felhívta, Duncan kérte, hogy küldjük újra az e-mailt, mert nem látta.',                  at: day(-35) },
        { kind: 'email', body: 'TP4: Duncan visszaírt (04-01): más cégről van szó, de érdekli, hívást kért. Visszaírtam: mikor jó?', at: '2026-04-01T10:00:00.000Z' },
        { kind: 'call',  body: 'TP5: Nem válaszolt, felhívtam – hosszabb beszélgetés. Duncannek lefagyott a weboldal, ezért szkeptikus lett, de végül kifejtette, hogy megnézi. Referenciát kért.', at: day(-20) },
        { kind: 'email', body: 'Demo videó elküldve.',                                                                         at: day(-15) },
      ],
      todos: [
        'Utánkövetés Duncan felé (demo videó visszajelzés)',
        'Referencia ügyfelek listájának összeállítása',
      ],
    },

    {
      name: 'TrustLayer',
      company: 'TrustLayer',
      stage: 'Contacted',
      notes:
        'San Francisco-i insurtech cég, 11–50 fő, AI-alapú certificate management platform. Becsült éves bevétel: ~$3,8–5,3M.\n\n' +
        'Kontakt: Ed (CEO).\n\n' +
        'Érték: $25k–$40k (7,7–12,3M Ft) + addon, ÁFA',
      activity: [
        { kind: 'call',  body: 'TP1: Sales – Hideg hívás, érdeklődnek.',                                at: day(-45) },
        { kind: 'call',  body: 'TP2: Telefonált a CEO-val (Ed), jelezte, hogy érdekli.',                at: day(-40) },
        { kind: 'email', body: 'TP3: Ed visszaírt e-mailre: „OK, köszönöm, megkaptam." (2026-03-31)',  at: '2026-03-31T16:00:00.000Z' },
      ],
      todos: [
        'Utánkövetés Ed felé – nincs még válasz a legutóbbi e-mail óta',
      ],
    },

    {
      name: 'Cognostiq',
      company: 'Cognostiq',
      stage: 'Proposal',
      notes:
        'Kis UK-székhelyű IT-tanácsadó cég, 2021-ben alapítva. Nyilvános bevételi adat nem elérhető. A CEO eladta az előző cégét, több magas pozíciót töltött be.\n\n' +
        'Kontakt: Nic.\n\n' +
        'Érték: $24k–$28k (7,4–8,6M Ft) + addon, ÁFA',
      activity: [
        { kind: 'call',  body: 'TP1: Sales felhívta ~1 hónapja, 3 perc – rossz e-mail-cím miatt az e-mail nem ment el.', at: day(-32) },
        { kind: 'call',  body: 'TP2: Hétfőn (03-31) felhívta, 4–5 perc – Nic megadta a helyes e-mail-címet, elküldte a projekteket; kedden nagyobb projekteket is küldött, konkrétumokat is megbeszéltek.', at: '2026-03-31T10:00:00.000Z' },
        { kind: 'email', body: 'TP3: Nic kedden (04-01) visszaírt: „Köszönöm, csütörtökön megnézem."', at: '2026-04-01T11:00:00.000Z' },
        { kind: 'call',  body: 'TP4: Pénteken felhívta – Nic elnézést kért, elfoglalt volt, csütörtökön nézi meg (április 9.).', at: '2026-04-03T14:00:00.000Z' },
      ],
      todos: [
        'Utánkövetés Nic felé – április 9. utáni visszajelzés',
      ],
    },

    {
      name: 'StackAI',
      company: 'StackAI',
      stage: 'Contacted',
      notes:
        'San Francisco-i, no-code AI-agent startup, 2023-ban alapítva, ~26 fő. Bevétel: ~$2,9M (2025 júniusig).\n\n' +
        'Érték: $14k–$20k (4,3–6,2M Ft) + addon, ÁFA',
      activity: [
        { kind: 'call', body: 'TP1: Sales – Hideg hívás.',                                                       at: day(-40) },
        { kind: 'call', body: 'TP2: Felhívta, megbeszéltek.',                                                    at: day(-35) },
        { kind: 'call', body: 'TP3: Kolléga felvette a telefont (03-31), szólt a CEO-nak, hogy nézze meg az e-mailt – a CEO éppen beteg volt.', at: '2026-03-31T13:00:00.000Z' },
      ],
      todos: [
        'Utánkövetés StackAI CEO felé (felépülése után)',
      ],
    },

    {
      name: 'Hadrius',
      company: 'Hadrius',
      stage: 'Contacted',
      notes:
        'New York-i, Y Combinator-támogatású fintech startup, ~12 fő. AI-alapú compliance platform pénzügyi cégek számára. Éves ARR: ~$1,8M (2024).\n\n' +
        'Érték: $15k–$25k (4,6–7,7M Ft) + addon, ÁFA',
      activity: [
        { kind: 'call', body: 'TP1: Sales felhívta, meetinget foglalt. (5 perces hideg hívás)',                                at: day(-30) },
        { kind: 'call', body: 'TP2: A meeting nem jött össze változások miatt, felhívta őket, pár szót váltottak – nem volt alkalmas időpont.', at: day(-22) },
      ],
      todos: [
        'Új meeting időpont egyeztetése',
      ],
    },

    {
      name: 'Stampede',
      company: 'Stampede',
      stage: 'Contacted',
      notes:
        'Edinburgh-i SaaS cég, 25 fő. Ügyfél-adat és Wi-Fi marketing eszközök. Bevétel nyilvánosan nem elérhető (PitchBook, 2026).\n\n' +
        'Érték: $2,5k–$25k (0,75–7,7M Ft) + addon, ÁFA',
      activity: [
        { kind: 'call',  body: 'TP1: Sales – Hideg hívás (5–6 perc), elmondta a jelenlegi problémáit.',                       at: day(-28) },
        { kind: 'call',  body: 'TP2: Felhívta, mert az e-mailre nem érkezett visszajelzés – a kolléga továbbította az e-mailt.', at: day(-18) },
      ],
      todos: [
        'Utánkövetés – e-mailre nem érkezett válasz',
      ],
    },

    {
      name: 'Maaind',
      company: 'Maaind',
      stage: 'Contacted',
      notes:
        'Kis AI neurotechnológiai cég, hangulatalapú személyre szabásra fókuszál, 1–10 fő. Becsült éves bevétel: ~$144k.\n\n' +
        'Érték: $5k–$10k (1,5–3M Ft) + addon, ÁFA',
      activity: [
        { kind: 'call',  body: 'TP1: Sales – 5 perces hideg hívás, meetinget foglalt.', at: day(-25) },
        { kind: 'note',  body: 'TP2: Nem tudott eljönni a meetingre, WhatsAppon írt.',  at: day(-18) },
      ],
      todos: [
        'Új időpont egyeztetése Maainddal',
      ],
    },
  ];

  let leadCount = 0, actCount = 0, todoCount = 0;
  for (const L of LEADS) {
    const { activity, todos, ...row } = L;
    const { data: lead, error } = await sb
      .from('leads')
      .insert({ ...row, owner_id })
      .select()
      .single();
    if (error) { console.error('lead insert failed for', L.name, error); continue; }
    leadCount++;
    if (activity?.length) {
      const rows = activity.map(a => ({ ...a, event_at: a.at, lead_id: lead.id, owner_id }));
      // strip the "at" field
      rows.forEach(r => delete r.at);
      const { error: e2 } = await sb.from('activity_log').insert(rows);
      if (e2) console.error('activity insert failed for', L.name, e2);
      else actCount += rows.length;
    }
    if (todos?.length) {
      const trows = todos.map(body => ({ body, lead_id: lead.id, owner_id }));
      const { error: e3 } = await sb.from('todos').insert(trows);
      if (e3) console.error('todo insert failed for', L.name, e3);
      else todoCount += trows.length;
    }
  }
  console.log(`DONE: inserted ${leadCount} leads, ${actCount} activity entries, ${todoCount} todos.`);
})();
