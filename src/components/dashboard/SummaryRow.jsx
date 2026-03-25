import SummaryCard from './SummaryCard'

export default function SummaryRow({ data }) {
  return (
    <div style={styles.row}>
      <SummaryCard title="Credit Score" value={data.credit_score} />
      <SummaryCard title="Payables" value={data.payables} />
      <SummaryCard title="Receivables" value={data.receivables} />
      <SummaryCard title="Balance" value={data.balance} />
    </div>
  )
}

const styles = {
  row: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 20,
  },
}

