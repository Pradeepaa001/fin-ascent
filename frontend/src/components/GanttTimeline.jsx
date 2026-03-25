export default function GanttTimeline({ data }) {
  return (
    <div style={styles.container}>
      <h3>Payables Timeline</h3>

      {data.map((item, i) => (
        <div key={i} style={styles.row}>
          <div style={styles.entity}>{item.entity}</div>

          <div style={styles.barContainer}>
            <div
              style={{
                ...styles.bar,
                background: item.color === "red" ? "#ef4444" : "#22c55e",
                width: "60%",
              }}
            />
          </div>

          <div>{item.due_date}</div>
        </div>
      ))}
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
  row: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "10px",
  },
  entity: {
    width: "150px",
  },
  barContainer: {
    flex: 1,
    background: "#eee",
    height: "8px",
    borderRadius: "4px",
  },
  bar: {
    height: "8px",
    borderRadius: "4px",
  },
};