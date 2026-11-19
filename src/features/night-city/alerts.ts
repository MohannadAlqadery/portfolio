/**
 * Alerts that light up the night-shift city. Each one is a realistic first-line SOC scenario with
 * its MITRE ATT&CK technique, the three checks an analyst would make, and how it closed.
 * Fictional hosts and data; no real indicators.
 */

export type Severity = 'critical' | 'high' | 'medium' | 'low'
export type Verdict = 'escalated' | 'benign' | 'false-positive'

export type AlertTemplate = {
  title: string
  technique: string
  techniqueName: string
  severity: Severity
  steps: readonly [string, string, string]
  verdict: Verdict
  outcome: string
}

export const alertTemplates: readonly AlertTemplate[] = [
  {
    title: 'Encoded PowerShell command',
    technique: 'T1059.001',
    techniqueName: 'PowerShell',
    severity: 'high',
    steps: [
      'Decoded the -enc payload: it downloads a script from an unknown domain',
      'Parent process is winword.exe, so it came from a document macro',
      'The domain was registered two days ago',
    ],
    verdict: 'escalated',
    outcome: 'Escalated to L2 with host isolation recommended',
  },
  {
    title: 'Impossible travel sign-in',
    technique: 'T1078',
    techniqueName: 'Valid Accounts',
    severity: 'medium',
    steps: [
      'Sign-ins from Abu Dhabi and Frankfurt, 20 minutes apart',
      'The second IP is the company VPN egress',
      'Same device ID and MFA satisfied on both',
    ],
    verdict: 'benign',
    outcome: 'Closed as benign true positive: VPN routing',
  },
  {
    title: 'Port scan from an internal host',
    technique: 'T1046',
    techniqueName: 'Network Service Discovery',
    severity: 'medium',
    steps: [
      '1,024 ports across 40 hosts in three minutes',
      'Source is the IT vulnerability scanner',
      'Matches tonight’s change ticket',
    ],
    verdict: 'benign',
    outcome: 'Closed as benign true positive: scheduled scan',
  },
  {
    title: 'Suspicious inbox forwarding rule',
    technique: 'T1564.008',
    techniqueName: 'Email Hiding Rules',
    severity: 'high',
    steps: [
      'Rule forwards anything mentioning “invoice” to a free-mail address',
      'Created four minutes after a sign-in from a new country',
      'The user confirms they didn’t create it',
    ],
    verdict: 'escalated',
    outcome: 'Escalated: account compromise, sessions revoked',
  },
  {
    title: 'LSASS memory access',
    technique: 'T1003.001',
    techniqueName: 'LSASS Memory',
    severity: 'critical',
    steps: [
      'procdump.exe read lsass.exe memory',
      'Run by a local admin account outside any change window',
      'The same account touched three servers in ten minutes',
    ],
    verdict: 'escalated',
    outcome: 'Escalated to L2 as a priority incident',
  },
  {
    title: 'New service installed',
    technique: 'T1543.003',
    techniqueName: 'Windows Service',
    severity: 'low',
    steps: [
      'Service “UpdaterSvc” created (event 7045)',
      'Binary is signed by the endpoint agent’s vendor',
      'Rolled out to 300 hosts in the last hour',
    ],
    verdict: 'false-positive',
    outcome: 'Closed as false positive: agent update, tuning requested',
  },
  {
    title: 'SSH brute force',
    technique: 'T1110',
    techniqueName: 'Brute Force',
    severity: 'medium',
    steps: [
      '412 failed logons from one external IP',
      'No successful logon followed',
      'IP is on two blocklists and now blocked at the firewall',
    ],
    verdict: 'benign',
    outcome: 'Closed: blocked, no access gained',
  },
  {
    title: 'Lookup of a newly registered domain',
    technique: 'T1071.004',
    techniqueName: 'DNS',
    severity: 'low',
    steps: [
      'Workstation resolved a three-day-old domain',
      'It’s a tracking link in a marketing newsletter',
      'No further connections from the host',
    ],
    verdict: 'false-positive',
    outcome: 'Closed as false positive: newsletter tracker',
  },
]

export const verdictLabel: Record<Verdict, string> = {
  escalated: 'Escalated',
  benign: 'Benign',
  'false-positive': 'False positive',
}

/** CSS custom property holding each severity's colour. */
export const severityColorVar: Record<Severity, string> = {
  critical: '--color-sev-critical',
  high: '--color-sev-high',
  medium: '--color-sev-medium',
  low: '--color-sev-low',
}
