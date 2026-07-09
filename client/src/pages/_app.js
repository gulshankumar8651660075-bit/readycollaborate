import '../styles/globals.css'
import Head from 'next/head'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>ReadyCollaborate | Real-time Collaborative Workspace</title>
        <meta name="description" content="A premium, full-featured real-time collaborative workspace for teams. Edit documents, track tasks, and sketch together in real-time." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
    </>
  )
}
