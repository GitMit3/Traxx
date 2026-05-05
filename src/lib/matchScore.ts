export interface UserProfile {
  skills: string
  education: string
  workExperience: string
  preferredTitles: string
  preferredLocations: string
  otherPreferences: string
}

export interface PlatsbankenJob {
  id: string
  title: string
  employer: string
  location: string
  publishedDate: string
  description: string
  sourceUrl: string
  occupation: string
}

export interface MatchResult {
  score: number
  reasons: string[]
}

export function calculateMatchScore(job: PlatsbankenJob, profile: UserProfile): MatchResult {
  let score = 0
  const reasons: string[] = []

  // Title match (0–30 pts)
  const titleKeywords = profile.preferredTitles.toLowerCase().split(/[\s,]+/).filter(Boolean)
  const jobTitle = job.title.toLowerCase()
  const titleMatches = titleKeywords.filter(k => jobTitle.includes(k)).length
  if (titleMatches > 0) {
    const pts = Math.min(30, titleMatches * 15)
    score += pts
    reasons.push(`Title match: +${pts}`)
  }

  // Skills match (0–30 pts)
  const skills = profile.skills.toLowerCase().split(/[\s,]+/).filter(Boolean)
  const desc = job.description.toLowerCase()
  const skillMatches = skills.filter(s => s.length > 2 && desc.includes(s)).length
  if (skillMatches > 0) {
    const pts = Math.min(30, skillMatches * 5)
    score += pts
    reasons.push(`Skills match (${skillMatches}): +${pts}`)
  }

  // Location match (0–20 pts)
  const prefLocs = profile.preferredLocations.toLowerCase().split(/[\s,]+/).filter(Boolean)
  const jobLoc = job.location.toLowerCase()
  const locMatch = prefLocs.some(l => l.length > 2 && jobLoc.includes(l))
  if (locMatch) {
    score += 20
    reasons.push(`Location match: +20`)
  } else if (desc.includes('remote') || desc.includes('distans') || jobLoc.includes('remote')) {
    score += 10
    reasons.push(`Remote possible: +10`)
  }

  // Experience / Education keywords (0–20 pts)
  const expKeywords = [profile.workExperience, profile.education]
    .join(' ')
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(k => k.length > 3)
  const expMatches = expKeywords.filter(k => desc.includes(k)).length
  if (expMatches > 0) {
    const pts = Math.min(20, expMatches * 4)
    score += pts
    reasons.push(`Background match: +${pts}`)
  }

  return { score: Math.min(100, score), reasons }
}
