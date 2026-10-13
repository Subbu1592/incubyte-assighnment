import Link from "next/link";

export default function NotFound() {
  return (
    <section className="panel form">
      <h1>Not found</h1>
      <p className="lede">That page or employee is not in Paybook.</p>
      <Link className="button" href="/employees">Back to people</Link>
    </section>
  );
}
