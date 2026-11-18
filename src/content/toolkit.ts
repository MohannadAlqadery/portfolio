/**
 * Skills laid out like an ATT&CK matrix: each column is a "tactic", each cell a "technique".
 * Title Case on purpose, matching how MITRE ATT&CK writes tactics and techniques
 * (short conjunctions like "and" stay lowercase; tool names keep their official spelling).
 * `level: 'basics'` marks skills that are still early-stage.
 */
export type ToolkitItem = { name: string; level?: 'basics' }
export type ToolkitColumn = { id: string; title: string; items: ToolkitItem[] }

export const toolkit: ToolkitColumn[] = [
  {
    id: 'operations',
    title: 'Security Operations',
    items: [
      { name: 'Alert Triage' },
      { name: 'Log Analysis' },
      { name: 'Phishing Analysis' },
      { name: 'Playbook Escalation' },
      { name: 'Vulnerability Assessment' },
      { name: 'Case Documentation' },
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
      { name: 'Elastic Stack' },
    ],
  },
  {
    id: 'query',
    title: 'Query and Scripting',
    items: [
      { name: 'KQL' },
      { name: 'Splunk SPL' },
      { name: 'Bash' },
      { name: 'Python', level: 'basics' },
    ],
  },
  {
    id: 'network-host',
    title: 'Network and Host Analysis',
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
    items: [
      { name: 'Incident Handling' },
      { name: 'Evidence Collection' },
      { name: 'Memory Forensics (Volatility)' },
    ],
  },
  {
    id: 'intel',
    title: 'Threat Intel and Frameworks',
    items: [
      { name: 'IOC Enrichment' },
      { name: 'MITRE ATT&CK' },
      { name: 'Cyber Kill Chain' },
      { name: 'NIST CSF' },
    ],
  },
  {
    id: 'offensive',
    title: 'Penetration Testing',
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
