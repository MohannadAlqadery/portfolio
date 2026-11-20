export const education = {
  degree: 'B.Sc. in Cybersecurity and Cloud Computing',
  school: 'Applied Sciences University',
  location: 'Amman, Jordan',
  start: '2022-02',
  end: '2026-06',
  result: '77.5% · Very Good',
  summary:
    'Offensive and defensive security alongside cloud infrastructure, with hands-on labs for most security courses. The degree covered both sides of an incident: how systems get attacked, and how they are defended, investigated and recovered.',
  coursework: [
    {
      name: 'Network Security',
      detail: 'Firewalls, VPNs, IDS/IPS, segmentation and secure network design.',
    },
    {
      name: 'Ethical Hacking',
      detail: 'Reconnaissance, scanning, exploitation and writing up findings.',
    },
    {
      name: 'Penetration Testing',
      detail:
        'Scoping an engagement, enumeration, exploitation, privilege escalation and a clear report.',
    },
    {
      name: 'Digital Forensics',
      detail: 'Evidence acquisition, chain of custody, disk and memory analysis.',
    },
    {
      name: 'Malware Analysis',
      detail: 'Static and dynamic analysis of samples in isolated lab environments.',
    },
    {
      name: 'Incident Response',
      detail: 'Preparation, detection, containment, eradication and recovery.',
    },
    {
      name: 'Cloud Security (AWS)',
      detail:
        'IAM and least privilege, VPC design, security groups, encryption and logging on AWS.',
    },
    {
      name: 'Risk Assessment',
      detail:
        'Identifying assets and threats, scoring likelihood and impact, and choosing proportionate controls.',
    },
  ],
} as const
