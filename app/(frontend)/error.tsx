"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="container not-found">
      <p className="eyebrow">Something interrupted this page</p>
      <h1>Let’s try that again.</h1>
      <p>
        The page could not finish loading. You can retry or return to the
        homepage.
      </p>
      <button className="button" onClick={reset}>
        Try again
      </button>
      <a className="text-link" href="/">
        Back to home
      </a>
    </section>
  );
}
