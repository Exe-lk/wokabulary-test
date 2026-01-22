import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Your Bill | Wokabulary',
  description: 'View and download your restaurant bill',
  viewport: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no',
}

export default function BillLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      {children}
    </>
  )
}
