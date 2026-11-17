/**
 * Skills laid out like an ATT&CK matrix: each column is a "tactic", each cell a "technique".
 * `level: 'basics'` mirrors the resume's own "(Basics)" markers.
 */
export type ToolkitItem = { name: string; level?: 'basics' }
export type ToolkitColumn = { id: string; title: string; items: ToolkitItem[] }

export const toolkit: ToolkitColumn[] = [
  {
    id: 'operations',
    title: 'Security operations',
    items: [
      { name: 'Alert triage' },
      { name: 'Incident response' },
      { name: 'Log analysis' },
      { name: 'Phishing analysis' },
      { name: 'Threat intel enrichment' },
      { name: 'Vulnerability assessment' },
      { name: 'Case documentation' },
    ],
  },
  {
    id: 'siem-edr',
    title: 'SIEM and EDR',
    items: [
      { name: 'Microsoft Sentinel' },
      { name: 'Defender XDR' },
      { name: 'Defender for Endpoint' },
      { name: 'Splunk' },
    ],
  },
  {
    id: 'query',
    title: 'Query and scripting',
    items: [
      { name: 'KQL' },
      { name: 'Splunk SPL' },
      { name: 'Bash', level: 'basics' },
      { name: 'Python', level: 'basics' },
    ],
  },
  {
    id: 'investigation',
    title: 'Investigation',
    items: [
      { name: 'Wireshark' },
      { name: 'VirusTotal' },
      { name: 'AbuseIPDB' },
      { name: 'Windows Event Logs' },
    ],
  },
  {
    id: 'offensive',
    title: 'Penetration testing',
    items: [
      { name: 'Nmap' },
      { name: 'Metasploit' },
      { name: 'Burp Suite' },
      { name: 'Gobuster' },
      { name: 'Enumeration' },
      { name: 'Privilege escalation' },
      { name: 'Pivoting' },
    ],
  },
  {
    id: 'frameworks',
    title: 'Frameworks',
    items: [{ name: 'MITRE ATT&CK' }, { name: 'NIST CSF' }, { name: 'NIST IR lifecycle' }],
  },
]
