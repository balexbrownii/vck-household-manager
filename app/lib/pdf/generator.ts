import { jsPDF } from 'jspdf'

const PAGE_WIDTH = 210 // A4 width in mm
const PAGE_HEIGHT = 297 // A4 height in mm
const MARGIN = 15
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

interface PDFConfig {
  title: string
  description?: string
  doc: jsPDF
  y: number
}

// Helper: Add header to PDF
export function addHeader(doc: jsPDF, title: string, description?: string): number {
  let y = MARGIN

  // Title
  doc.setFontSize(20)
  doc.setFont('Helvetica', 'bold')
  doc.text(title, MARGIN, y)
  y += 12

  // Description
  if (description) {
    doc.setFontSize(11)
    doc.setFont('Helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(description, MARGIN, y)
    y += 8
  }

  // Reset text color
  doc.setTextColor(0, 0, 0)

  // Add separator line
  y += 4
  doc.setDrawColor(0, 0, 0)
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y)
  y += 8

  return y
}

// Helper: Add section title
export function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFontSize(13)
  doc.setFont('Helvetica', 'bold')
  doc.setTextColor(0, 51, 102) // Dark blue
  doc.text(title, MARGIN, y)
  doc.setTextColor(0, 0, 0)
  return y + 8
}

// Helper: Add bullet point
export function addBulletPoint(
  doc: jsPDF,
  text: string,
  y: number,
  bulletColor: [number, number, number] = [0, 0, 0]
): number {
  const bulletX = MARGIN + 5
  const textX = MARGIN + 12

  doc.setFontSize(10)
  doc.setFont('Helvetica', 'normal')

  // Draw bullet
  doc.setFillColor(...bulletColor)
  doc.circle(bulletX, y - 1, 1, 'F')

  // Wrap text if needed
  const wrappedText = doc.splitTextToSize(text, CONTENT_WIDTH - 12)
  doc.text(wrappedText, textX, y)

  return y + wrappedText.length * 5 + 2
}

// Helper: Add table
export function addTable(
  doc: jsPDF,
  headers: string[],
  rows: string[][],
  y: number,
  columnWidths?: number[]
): number {
  const defaultColWidth = CONTENT_WIDTH / headers.length
  const colWidths = columnWidths || Array(headers.length).fill(defaultColWidth)

  // Headers
  doc.setFontSize(10)
  doc.setFont('Helvetica', 'bold')
  doc.setFillColor(220, 220, 220)

  let x = MARGIN
  headers.forEach((header, i) => {
    doc.rect(x, y, colWidths[i], 6, 'F')
    doc.text(header, x + 2, y + 4)
    x += colWidths[i]
  })

  y += 7

  // Rows
  doc.setFont('Helvetica', 'normal')
  doc.setFontSize(9)

  rows.forEach((row, rowIndex) => {
    if (y > PAGE_HEIGHT - MARGIN) {
      doc.addPage()
      y = MARGIN
    }

    x = MARGIN
    row.forEach((cell, colIndex) => {
      if (rowIndex % 2 === 0) {
        doc.setFillColor(245, 245, 245)
        doc.rect(x, y, colWidths[colIndex], 5, 'F')
      }
      doc.text(cell, x + 2, y + 3)
      x += colWidths[colIndex]
    })

    y += 6
  })

  return y + 4
}

// Helper: Check page break
export function checkPageBreak(doc: jsPDF, y: number, neededSpace: number = 30): number {
  if (y + neededSpace > PAGE_HEIGHT - MARGIN) {
    doc.addPage()
    return MARGIN
  }
  return y
}

// Chart 1: Daily Expectations Chart
export function generateDailyExpectationsChart(): jsPDF {
  const doc = new jsPDF()

  let y = addHeader(
    doc,
    'Daily Expectations Chart',
    'Requirements for screen time unlock'
  )

  y = addSectionTitle(doc, 'The 4 Daily Expectations', y)

  const expectations = [
    {
      name: 'Exercise',
      description: 'At least 30 minutes of physical activity or sports',
      points: '✓ or ✗'
    },
    {
      name: 'Reading',
      description: 'At least 30 minutes of reading (books, not screens)',
      points: '✓ or ✗'
    },
    {
      name: 'Tidy Up',
      description: 'Keep bedroom and living spaces neat and organized',
      points: '✓ or ✗'
    },
    {
      name: 'Daily Chore',
      description: 'Complete assigned rotating chore for the day',
      points: '✓ or ✗'
    },
  ]

  expectations.forEach((exp, i) => {
    y = checkPageBreak(doc, y, 15)

    doc.setFontSize(11)
    doc.setFont('Helvetica', 'bold')
    doc.text(`${i + 1}. ${exp.name}`, MARGIN, y)
    y += 5

    doc.setFontSize(10)
    doc.setFont('Helvetica', 'normal')
    y = addBulletPoint(doc, exp.description, y, [0, 102, 204])
  })

  y += 8
  y = addSectionTitle(doc, 'How It Works', y)

  const rules = [
    'All 4 expectations must be marked complete each day',
    'When all 4 are complete, screen time is UNLOCKED',
    'Screen time remains locked until all 4 are done',
    'Resets daily at midnight',
    'Perfect for encouraging healthy habits!',
  ]

  rules.forEach((rule) => {
    y = addBulletPoint(doc, rule, y)
  })

  return doc
}

// Chart 2: Chore Rotation Chart
export function generateChoreRotationChart(): jsPDF {
  const doc = new jsPDF()

  let y = addHeader(
    doc,
    'Chore Rotation Chart',
    '3-week A/B/C rotation'
  )

  y = addSectionTitle(doc, 'Weekly Assignments', y)

  const assignments = [
    ['Simone', 'Week A: Bathrooms & Entry', 'Week B: Kitchen', 'Week C: Living Spaces'],
    ['Alexander', 'Week A: Living Spaces', 'Week B: Bathrooms & Entry', 'Week C: Kitchen'],
    ['Elise', 'Week A: Kitchen', 'Week B: Living Spaces', 'Week C: Bathrooms & Entry'],
  ]

  y = addTable(
    doc,
    ['Child', 'Week A', 'Week B', 'Week C'],
    assignments,
    y,
    [30, 50, 50, 50]
  )

  y += 8
  y = addSectionTitle(doc, 'Daily Room Assignments', y)

  const dailyRooms = [
    ['Monday', 'Kitchen', 'Living Room', 'Bathroom #1'],
    ['Tuesday', 'Kitchen', 'Family Room', 'Bathroom #2'],
    ['Wednesday', 'Kitchen', 'Dining Room', 'Bathroom #3'],
    ['Thursday', 'Kitchen', 'Hallways/Stairs', 'Bathroom #4'],
    ['Friday', 'Kitchen', 'Touch-Up', 'Entry/Mudroom'],
    ['Saturday', 'Kitchen', 'Deep Clean', 'Deep Clean'],
    ['Sunday', 'Kitchen', 'Organization', 'Organization'],
  ]

  y = addTable(
    doc,
    ['Day', 'Kitchen', 'Living Spaces', 'Bathrooms & Entry'],
    dailyRooms,
    y,
    [35, 50, 55, 55]
  )

  y += 8
  y = addSectionTitle(doc, 'How It Works', y)

  const rules = [
    'Rotation changes every Monday automatically',
    'Kids know their assignment a week in advance',
    'Daily room varies within their assignment',
    'Completion tracked daily',
    'Helps develop responsibility and consistency',
  ]

  rules.forEach((rule) => {
    y = addBulletPoint(doc, rule, y)
  })

  return doc
}

// Chart 3: Screen Time Rules Chart
export function generateScreenTimeChart(): jsPDF {
  const doc = new jsPDF()

  let y = addHeader(
    doc,
    'Screen Time Rules',
    'Age-based limits with bonus opportunities'
  )

  y = addSectionTitle(doc, 'Age-Based Screen Time Limits', y)

  const limits = [
    ['Simone (8)', '60 min', '120 min', '7:30 PM', '8:00 PM'],
    ['Alexander (11)', '90 min', '150 min', '8:00 PM', '8:30 PM'],
    ['Elise (13)', '120 min', '180 min', '8:30 PM', '9:00 PM'],
  ]

  y = addTable(
    doc,
    ['Child', 'Weekday', 'Weekend', 'Cutoff (Wday)', 'Cutoff (Wend)'],
    limits,
    y,
    [35, 35, 35, 35, 35]
  )

  y += 8
  y = addSectionTitle(doc, 'Bonus Time Rules', y)

  const bonusRules = [
    'Earn +15 minutes per completed gig',
    'Maximum 2 gigs per day = +30 minutes max',
    'Bonus time must be used same day (doesn\'t carry over)',
    'Bonus unlocked when all 4 daily expectations are complete',
  ]

  bonusRules.forEach((rule) => {
    y = addBulletPoint(doc, rule, y)
  })

  y += 8
  y = addSectionTitle(doc, 'How It Works', y)

  const howItWorks = [
    'Base time = age-based limit (weekday vs weekend)',
    'Total time = base time + bonus time',
    'Timer counts down in real-time',
    'Auto-locks when timer reaches zero',
    'Parent can manually unlock for special occasions',
  ]

  howItWorks.forEach((rule) => {
    y = addBulletPoint(doc, rule, y)
  })

  return doc
}

// Chart 4: Gigs Catalog Chart
export function generateGigsCatalogChart(): jsPDF {
  const doc = new jsPDF()

  let y = addHeader(
    doc,
    'Gigs Catalog',
    'Earn stars toward $100 milestones'
  )

  y = addSectionTitle(doc, 'Gig Tiers & Star Values', y)

  const tiers = [
    ['Tier 1', '10 stars', 'Easy tasks (15-20 min)', 'Swimming, light cleaning'],
    ['Tier 2', '20 stars', 'Moderate tasks (25-30 min)', 'Deep cleaning, yard work'],
    ['Tier 3', '30 stars', 'Challenging tasks (30-45 min)', 'Heavy lifting, project work'],
    ['Tier 4', '40 stars', 'Very difficult (45-60 min)', 'Major projects, landscaping'],
    ['Tier 5', '50 stars', 'Premium tasks (60+ min)', 'Complex projects, special requests'],
  ]

  y = addTable(
    doc,
    ['Tier', 'Stars', 'Difficulty', 'Examples'],
    tiers,
    y,
    [25, 25, 45, 75]
  )

  y += 8
  y = addSectionTitle(doc, 'Star Milestones', y)

  const milestones = [
    ['100 stars', '= $50 cash or reward'],
    ['200 stars', '= $100 cash or major reward'],
    ['300 stars', '= $150 cash or special experience'],
  ]

  y = addTable(doc, ['Stars', 'Reward'], milestones, y, [50, 100])

  y += 8
  y = addSectionTitle(doc, 'How It Works', y)

  const howItWorks = [
    'Claim a gig → Complete it → Parent inspects & approves',
    'If approved, stars are awarded immediately',
    'If rejected, redo for free (no penalty)',
    'Can only have one active gig at a time',
    'Completed gigs may unlock bonus screen time',
    'Track progress toward milestones in real-time',
  ]

  howItWorks.forEach((rule) => {
    y = addBulletPoint(doc, rule, y)
  })

  return doc
}

// Chart 5: Timeout Rules Chart
export function generateTimeoutRulesChart(): jsPDF {
  const doc = new jsPDF()

  let y = addHeader(
    doc,
    'Timeout Rules',
    'Quick reference for violations and their consequences'
  )

  y = addSectionTitle(doc, 'Violation Categories & Timeouts', y)

  const violations = [
    ['Disrespect', '10 min', 'Disrespectful tone or attitude'],
    ['Defiance', '15 min', 'Refusing to follow instruction'],
    ['Arguing', '10 min', 'Back-talking or arguing'],
    ['Sibling Conflict', '10 min', 'Fighting or arguing with sibling'],
    ['Dishonesty', '20 min', 'Being dishonest or lying'],
    ['Property Damage', '30 min', 'Intentional damage to property'],
    ['Safety Risk', '30 min', 'Unsafe or dangerous behavior'],
    ['Screen Violation', '15 min', 'Using screen without permission'],
    ['Incomplete Chore', '5 min', 'Rushed or incomplete work'],
    ['Not Listening', '5 min', 'Ignoring instructions'],
  ]

  y = addTable(
    doc,
    ['Violation', 'Timeout', 'Description'],
    violations,
    y,
    [35, 25, 110]
  )

  y += 8
  y = addSectionTitle(doc, 'How It Works', y)

  const rules = [
    'Parent logs violation with optional notes',
    'Timer starts immediately',
    'If caught resisting/not going: Reset = full timeout again',
    'Each reset adds the full base duration again',
    'Timeout complete = child must demonstrate understanding',
    'Track patterns to identify behavior trends',
    'Double timeout possible for repeated refusal',
  ]

  rules.forEach((rule) => {
    y = addBulletPoint(doc, rule, y)
  })

  return doc
}
