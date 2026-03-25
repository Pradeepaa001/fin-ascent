export default function PayablesTable({ data }) {
  return (
    <div style={styles.container}>
      <h3>Top Payables</h3>

      <table style={styles.table}>
        <thead>
          <tr>
            <th>Due Date</th>
            <th>Company</th>
            <th>Amount</th>
          </tr>
        </thead>

        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              <td>{row.due_date}</td>
              <td>{row.company}</td>
              <td style={{ color: "red" }}>₹ {row.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  container: {
    background: "#fff",
    padding: "20px",
    borderRadius: "16px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
};