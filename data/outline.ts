/** Small, eager outline. The full day content is lazy-loaded from data/days. */
export interface Phase {
  name: string;
  short: string;
  from: number;
  to: number;
  days: string[];
}

export const PHASES: Phase[] = [
  { name: 'Foundations', short: 'Found', from: 1, to: 15, days: ['Numbers and symbols', 'Variables', 'Functions', 'Graphs', 'Vectors', 'Matrices', 'Derivatives', 'Gradients', 'Probability', 'Statistics', 'Python thinking', 'Algorithms', 'Linux', 'Networks', 'Databases'] },
  { name: 'AI and ML', short: 'ML', from: 16, to: 30, days: ['Data', 'Linear regression', 'Classification', 'Loss', 'Gradient descent', 'Neural networks', 'Backpropagation', 'PyTorch', 'Embeddings', 'Attention', 'Transformers', 'Tokenisation', 'LLMs', 'Fine-tuning', 'Evaluation'] },
  { name: 'Cyber', short: 'Cyber', from: 31, to: 45, days: ['Threats', 'TCP/IP', 'DNS and HTTP', 'Operating systems', 'Identity', 'Access control', 'Cryptography', 'Hashes', 'Secure coding', 'Web security', 'Cloud security', 'Vulnerabilities', 'Detection', 'Incident response', 'Threat modelling'] },
  { name: 'Production AI', short: 'Prod', from: 46, to: 60, days: ['APIs', 'Containers', 'Docker', 'Cloud compute', 'GPUs', 'Data pipelines', 'Model serving', 'MLOps', 'Observability', 'Scaling', 'RAG', 'Vector search', 'Agents', 'Evals', 'Reliability'] },
  { name: 'AI security and research', short: 'AISec', from: 61, to: 75, days: ['Prompt injection', 'Adversarial ML', 'Data poisoning', 'Model theft', 'Privacy', 'Agent security', 'Red teaming', 'Benchmarks', 'Research papers', 'Hypotheses', 'Experiments', 'Ablations', 'Reproduction', 'Novelty', 'Research defence'] },
  { name: 'Head of AI', short: 'Lead', from: 76, to: 90, days: ['Architecture', 'Build or buy', 'Model choice', 'Security review', 'Cost control', 'Hiring', 'Roadmaps', 'Stakeholders', 'AI policy', 'Incident command', 'Research strategy', 'Production launch', 'Board defence', 'Original system', 'Final defence'] },
];

export const TOTAL_DAYS = 90;

export function phaseFor(day: number): Phase {
  return PHASES.find((p) => day >= p.from && day <= p.to) ?? PHASES[0];
}

export function titleFor(day: number): string {
  const p = phaseFor(day);
  return p.days[day - p.from] ?? '';
}
