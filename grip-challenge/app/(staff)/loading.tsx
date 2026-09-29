export default function Loading() {
  return (
    <div className="stack" style={{ gap: 14 }} aria-busy="true" aria-label="טוען">
      <div className="skeleton" style={{ height: 48, width: '40%' }} />
      <div className="skeleton card-sk" style={{ height: 90 }} />
      <div className="skeleton card-sk" style={{ height: 72 }} />
      <div className="skeleton card-sk" style={{ height: 72 }} />
      <div className="skeleton card-sk" style={{ height: 72 }} />
    </div>
  )
}
