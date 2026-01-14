import { redirect } from 'next/navigation'

// Redirect to the unified review page
// All gig reviews (with or without photos) are now consolidated there
export default function InspectGigsPage() {
  redirect('/dashboard/review')
}
