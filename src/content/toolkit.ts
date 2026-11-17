/**
 * Skills laid out like an ATT&CK matrix: each column is a "tactic", each cell a "technique".
 * `level: 'basics'` marks skills that are still early-stage.
 * The detection, network/host, IR/forensics and threat-intel columns draw on the
 * Hack The Box CDSA (Certified Defensive Security Analyst) job-role path.
 */
export type ToolkitItem = { name: string; level?: 'basics' }
export type ToolkitColumn = { id: string; title: string; items: ToolkitItem[] }

export const toolkit: ToolkitColumn[] = [
  {
    id: 'operations',
    title: 'Security operations',
    items: [
      { name: 'Alert triage' },
      { name: 'Log analysis' },
      { name: 'Phishing analysis' },
      { name: 'Playbook escalation' },
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
      { name: 'Elastic Stack' },
    ],
  },
  {
    id: 'query',
    title: 'Query and scripting',
    items: [
      { name: 'KQL' },
      { name: 'Splunk SPL' },
      { name: 'Bash' },
      { name: 'Python', level: 'basics' },
    ],
  },
  {
    id: 'network-host',
    title: 'Network and host analysis',
    items: [
      { name: 'Wireshark' },
      { name: 'tcpdump' },
      { name: 'Zeek' },
      { name: 'Windows Event Logs' },
      { name: 'Sysmon' },
      { name: 'VirusTotal' },
      { name: 'AbuseIPDB' },
    ],
  },
  {
    id: 'detection',
    title: 'Detection and hunting',
    items: [
      { name: 'Threat hunting' },
      { name: 'Suricata' },
      { name: 'Snort' },
      { name: 'AD attack detection' },
      { name: 'Sigma rules', level: 'basics' },
      { name: 'YARA rules', level: 'basics' },
    ],
  },
  {
    id: 'ir-forensics',
    title: 'Incident response and forensics',
    items: [
      { name: 'Incident handling' },
      { name: 'Evidence collection' },
      { name: 'Memory forensics (Volatility)' },
      { name: 'Velociraptor' },
      { name: 'KAPE' },
    ],
  },
  {
    id: 'intel',
    title: 'Threat intel and frameworks',
    items: [
      { name: 'IOC enrichment' },
      { name: 'MITRE ATT&CK' },
      { name: 'Cyber Kill Chain' },
      { name: 'Pyramid of Pain' },
      { name: 'NIST CSF' },
      { name: 'NIST IR lifecycle' },
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
]
