/**
 * Skills laid out like an ATT&CK matrix: each column is a "tactic", each cell a "technique".
 * Title Case on purpose, matching how MITRE ATT&CK writes tactics and techniques
 * (short conjunctions like "and" stay lowercase; tool names keep their official spelling).
 * `level: 'basics'` marks skills that are still early-stage; `core` marks what I use on shift.
 */
export type ToolkitItem = { name: string; level?: 'basics'; core?: true }
export type ToolkitColumn = { id: string; title: string; summary: string; items: ToolkitItem[] }

export const toolkit: ToolkitColumn[] = [
  {
    id: 'operations',
    title: 'Security Operations',
    summary:
      'The core of a shift: triage, analysis and escalation, written up so the next analyst can follow.',
    items: [
      { name: 'Alert Triage', core: true },
      { name: 'Log Analysis', core: true },
      { name: 'Phishing Analysis', core: true },
      { name: 'Playbook Escalation' },
      { name: 'Vulnerability Assessment' },
      { name: 'Case Documentation', core: true },
    ],
  },
  {
    id: 'siem-edr',
    title: 'SIEM and EDR',
    summary:
      'Where alerts come from, and where I pivot from an alert to the device, user and timeline behind it.',
    items: [
      { name: 'Microsoft Sentinel', core: true },
      { name: 'Defender XDR', core: true },
      { name: 'Defender for Endpoint' },
      { name: 'Splunk', core: true },
      { name: 'Elastic Stack' },
    ],
  },
  {
    id: 'query',
    title: 'Query and Scripting',
    summary: 'Asking the logs the right questions, and scripting the repetitive parts.',
    items: [
      { name: 'KQL', core: true },
      { name: 'Splunk SPL' },
      { name: 'Bash' },
      { name: 'Python', level: 'basics' },
    ],
  },
  {
    id: 'network-host',
    title: 'Network and Host Analysis',
    summary: 'Packets, processes and event logs: the raw evidence under every alert.',
    items: [
      { name: 'Wireshark' },
      { name: 'tcpdump' },
      { name: 'Zeek' },
      { name: 'Windows Event Logs' },
      { name: 'Sysmon' },
      { name: 'VirusTotal' },
    ],
  },
  {
    id: 'detection',
    title: 'Detection and Hunting',
    summary: 'Looking for what didn’t raise an alert, and turning findings into rules.',
    items: [
      { name: 'Threat Hunting' },
      { name: 'Suricata' },
      { name: 'Snort' },
      { name: 'AD Attack Detection' },
      { name: 'Sigma Rules', level: 'basics' },
      { name: 'YARA Rules', level: 'basics' },
    ],
  },
  {
    id: 'ir-forensics',
    title: 'Incident Response and Forensics',
    summary: 'Containing, collecting and explaining what happened, in order.',
    items: [
      { name: 'Incident Handling' },
      { name: 'Evidence Collection' },
      { name: 'Memory Forensics (Volatility)' },
    ],
  },
  {
    id: 'intel',
    title: 'Threat Intel and Frameworks',
    summary: 'Context for every indicator, and a shared language for describing attacks.',
    items: [
      { name: 'IOC Enrichment', core: true },
      { name: 'MITRE ATT&CK', core: true },
      { name: 'Cyber Kill Chain' },
      { name: 'NIST CSF' },
    ],
  },
  {
    id: 'offensive',
    title: 'Penetration Testing',
    summary: 'The attacker’s view, from eJPTv2 and coursework, which makes alerts easier to judge.',
    items: [
      { name: 'Nmap' },
      { name: 'Metasploit' },
      { name: 'Burp Suite' },
      { name: 'Gobuster' },
      { name: 'Enumeration' },
      { name: 'Privilege Escalation' },
      { name: 'Pivoting' },
    ],
  },
]
