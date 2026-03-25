export default function SummaryCard({ title, value }) {
  return (
    <div style={styles.card}>
      <p style={styles.title}>{title}</p>
      <h2 style={styles.value}>₹ {value || 0}</h2>
    </div>
  );
}

const styles = {
  card: {
    background: "#fff",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },
  title: {
    color: "#666",
    fontSize: "14px",
  },
  value: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#4f46e5",
  },
};