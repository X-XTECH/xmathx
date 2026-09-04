import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="app">
      <section className="stage">
        <article className="card">
          <div className="chip-row"><span className="chip warn">Not found</span></div>
          <div className="body center">
            <p className="hero">404</p>
            <p className="big">That page does not exist.</p>
            <p className="mid"><Link href="/">Back to today&apos;s lesson</Link></p>
          </div>
        </article>
      </section>
    </main>
  );
}
