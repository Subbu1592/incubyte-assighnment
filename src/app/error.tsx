"use client";

export default function ErrorPage({ error }: { error: Error }) {
  return (
    <section className="panel form">
      <h1>Something went wrong</h1>
      <p className="lede">{error.message || "Paybook could not load this page."}</p>
    </section>
  );
}
