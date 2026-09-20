/**
 * Scam-signal definitions for the RakshaCall detection engine.
 *
 * Each category models one real-world social-engineering tactic documented in
 * Indian "digital arrest" / impersonation-scam advisories (police cybercrime
 * units, PIB fact-checks, RBI/bank consumer-awareness bulletins). Patterns are
 * plain-English regexes; the engine matches case-insensitively against the
 * caller's spoken/typed lines.
 *
 * Weights are severity, not frequency: a single "remote access" request is a
 * near-certain scam signal, while "urgency" language alone is common in many
 * legitimate calls too, so it carries less weight on its own.
 */

export type SignalCategoryId =
  | 'authority'
  | 'urgency'
  | 'threat'
  | 'isolation'
  | 'surveillance'
  | 'credentialExtraction'
  | 'financialExtraction'
  | 'remoteAccess'

export interface SignalCategory {
  id: SignalCategoryId
  weight: number
  patterns: RegExp[]
}

export const SIGNAL_CATEGORIES: SignalCategory[] = [
  {
    id: 'authority',
    weight: 15,
    patterns: [
      /\bcbi\b/i,
      /\brbi\b/i,
      /\btrai\b/i,
      /\bcustoms?\b/i,
      /\bcyber ?crime\b/i,
      /\bnarcotics?\b/i,
      /\b(police|inspector|constable)\b/i,
      /\bgovernment officer\b/i,
      /\binvestigation (department|officer|team)\b/i,
      /\b(fir|first information report)\b/i,
      /\bsupreme court\b/i,
      /\baadhaar (card )?(is )?link(ed)?\b/i,
      /\bmy (badge|officer id) number\b/i,
    ],
  },
  {
    id: 'urgency',
    weight: 12,
    patterns: [
      /\bimmediately\b/i,
      /\bright now\b/i,
      /\bwithin (the )?(next )?(one |1 |\d+ )?(hour|minute|min)s?\b/i,
      /\bas soon as possible\b/i,
      /\bbefore it('?s| is) too late\b/i,
      /\blast (chance|warning)\b/i,
      /\bdo it now\b/i,
      /\burgent(ly)?\b/i,
    ],
  },
  {
    id: 'threat',
    weight: 18,
    patterns: [
      /\barrest(ed)?\b/i,
      /\bwarrant\b/i,
      /\bjail\b/i,
      /\bcriminal case\b/i,
      /\blegal action\b/i,
      /\baccount (will be )?(frozen|blocked|suspended)\b/i,
      /\bdigital arrest\b/i,
      /\bnon[- ]?bailable\b/i,
      /\bconfiscat(e|ed|ion)\b/i,
      /\bmoney laundering\b/i,
      /\bcase (has been )?(filed|registered) against you\b/i,
    ],
  },
  {
    id: 'isolation',
    weight: 22,
    patterns: [
      /\b(don'?t|do not|must not|should not|never) (tell|inform|call|contact) (anyone|any ?one|your family|your husband|your wife|your children|your son|your daughter)\b/i,
      /\b(don'?t|do not|must not|should not) (hang up|disconnect|cut the call)\b/i,
      /\bstay on (the )?(call|line)\b/i,
      /\bkeep this confidential\b/i,
      /\bthis is (strictly )?(private|confidential)\b/i,
      /\bdo not discuss (this )?with (anyone|anybody)\b/i,
      /\bit'?s a secret (investigation|matter)\b/i,
    ],
  },
  {
    id: 'surveillance',
    weight: 20,
    patterns: [
      /\bkeep (your )?(camera|video) on\b/i,
      /\bdon'?t (switch off|turn off) (the )?(camera|video)\b/i,
      /\bshow (me|us) your (surroundings|room|house)\b/i,
      /\bshare your screen\b/i,
      /\bturn on (your )?(video|camera)\b/i,
      /\bstay visible\b/i,
    ],
  },
  {
    id: 'credentialExtraction',
    weight: 25,
    patterns: [
      /\botp\b/i,
      /\b(pin|upi pin|atm pin)\b/i,
      /\bpassword\b/i,
      /\bverification code\b/i,
      /\bcvv\b/i,
      /\bshare the code\b/i,
      /\bread (out|me) the (otp|code|number)\b/i,
    ],
  },
  {
    id: 'financialExtraction',
    weight: 25,
    patterns: [
      /\btransfer (the )?(money|funds|amount)\b/i,
      /\b(upi|bank account|account number) (details|number)?\b/i,
      /\bprocessing fee\b/i,
      /\bpay (a )?(fine|penalty|fee)\b/i,
      /\bsend (money|rs\.?|rupees|inr)\b/i,
      /\brefundable (deposit|amount)\b/i,
      /\bverification (amount|deposit|charge)\b/i,
      /\bfor verification purposes?,? (send|pay|transfer)\b/i,
    ],
  },
  {
    id: 'remoteAccess',
    weight: 28,
    patterns: [
      /\banydesk\b/i,
      /\bteamviewer\b/i,
      /\bquick support\b/i,
      /\binstall (this |the )?(app|application)\b/i,
      /\bdownload (this |the )?(app|application)\b/i,
      /\bgive me the code (shown|displayed) on your screen\b/i,
      /\bremote access\b/i,
      /\bscreen sharing app\b/i,
    ],
  },
]

/** Risk-level thresholds on the 0-100 aggregate score. */
export const RISK_THRESHOLDS = {
  low: 0,
  medium: 25,
  high: 55,
} as const

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'

export function riskLevelForScore(score: number): RiskLevel {
  if (score >= RISK_THRESHOLDS.high) return 'HIGH'
  if (score >= RISK_THRESHOLDS.medium) return 'MEDIUM'
  return 'LOW'
}
