// ---------------------------------------------------------------------------
// Research papers. Edit the text here; the layout lives in components/Research.jsx.
// Only supplied details are included: no dates, results or venues beyond these.
// ---------------------------------------------------------------------------

export const papers = [
  {
    id: 'ghost-evidence',
    number: 'PAPER 01',
    meta: [
      { text: 'AIFB 2026', strong: true },
      { text: '2ND INTERNATIONAL CONFERENCE ON AI FOR FORENSICS AND BIOMETRICS' },
      { text: 'IIT DHARWAD' },
    ],
    status: { label: 'UNDER REVIEW', sub: 'AIFB 2026', tone: 'review' },
    // Shown verbatim as a separate reference label. Its meaning has not been supplied, so none is implied.
    reference: 'DECISION BCT 2024',
    title:
      'Ghost Evidence: An Explainable Framework for Digital Evidence Correlation and Event Reconstruction from Missing Primary Evidence',
    authors: [
      { name: 'Andryan Durai Jebin' },
      { name: 'Darshan C S' },
      { name: 'Akshaya P' },
      { name: 'Dinesh G', highlight: true },
    ],
    affiliation: 'Rajalakshmi Engineering College',
    abstract:
      'When the primary artifact has been deleted or overwritten, Ghost Evidence reconstructs the probable digital event and its time interval from the secondary traces that survive. It combines a forensic rule layer, temporal reasoning, interpretable machine-learning correlation, and Bayesian-style evidence aggregation.',
    // The framework figure (a file in /public). Set `src: null` to show the caption on its own.
    figure: {
      src: '/research/ghost-evidence-fig1.webp',
      width: 1483,
      height: 371,
      alt: 'Framework diagram. Surviving secondary traces (event logs, prefetch, registry, thumbnails, cloud sync) pass through four layers: L1 Forensic rules, L2 Temporal reasoning, L3 Interpretable ML correlation and L4 Bayesian-style aggregation. The primary artifact is marked deleted, and the output is the probable event and time interval.',
    },
    caption: {
      label: 'FIG. 1',
      text: 'Surviving secondary traces pass through four reasoning layers to recover the deleted event and when it happened.',
    },
    contributions: [
      'Formal problem definition',
      'Evidence-source taxonomy with reliability weighting',
      'Expected-trace-absence feature',
      'Controlled evidence-removal evaluation',
      'Forensic-validity & governance analysis',
    ],
  },
]
