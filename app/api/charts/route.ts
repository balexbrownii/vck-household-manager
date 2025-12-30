import { NextRequest, NextResponse } from 'next/server'
import {
  generateDailyExpectationsChart,
  generateChoreRotationChart,
  generateScreenTimeChart,
  generateGigsCatalogChart,
  generateTimeoutRulesChart,
} from '@/lib/pdf/generator'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chartType = searchParams.get('type')

    let doc
    let filename

    switch (chartType) {
      case 'daily-expectations':
        doc = generateDailyExpectationsChart()
        filename = 'Daily-Expectations-Chart.pdf'
        break

      case 'chore-rotation':
        doc = generateChoreRotationChart()
        filename = 'Chore-Rotation-Chart.pdf'
        break

      case 'screen-time':
        doc = generateScreenTimeChart()
        filename = 'Screen-Time-Rules.pdf'
        break

      case 'gigs-catalog':
        doc = generateGigsCatalogChart()
        filename = 'Gigs-Catalog.pdf'
        break

      case 'timeout-rules':
        doc = generateTimeoutRulesChart()
        filename = 'Timeout-Rules.pdf'
        break

      default:
        return NextResponse.json(
          { error: 'Invalid chart type. Valid options: daily-expectations, chore-rotation, screen-time, gigs-catalog, timeout-rules' },
          { status: 400 }
        )
    }

    // Get PDF as bytes
    const pdfBytes = doc.output('arraybuffer')

    // Return as downloadable file
    return new Response(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
