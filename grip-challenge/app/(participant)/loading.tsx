// Shown instantly while a participant screen loads, so a tap never feels dead.
export default function Loading() {
  return (
    <main className="app" aria-busy="true" aria-label="טוען">
      <div className="skeleton" style={{ height: 56, width: '60%' }} />
      <div className="skeleton card-sk" style={{ height: 110 }} />
      <div className="skeleton card-sk" style={{ height: 170 }} />
      <div className="skeleton card-sk" style={{ height: 76 }} />
    </main>
  )
}
