import { useEffect, useState } from "react";
import api from "../api/api";
import supabase from "../api/supabase";

import SummaryRow from "../components/SummaryRow";
import GanttTimeline from "../components/GanttTimeline";
import PayablesTable from "../components/PayablesTable";

export default function Dashboard() {
  const [summary, setSummary] = useState({});
  const [timeline, setTimeline] = useState([]);
  const [table, setTable] = useState([]);

  useEffect(() => {
    async function fetchData() {
      // ✅ GET USER ID HERE
      const userRes = await supabase.auth.getUser();
      const user_id = userRes.data.user?.id;

      if (!user_id) {
        console.error("User not logged in");
        return;
      }

      // ✅ USE user_id IN ALL API CALLS
      const [credit, payables, receivables, balance, gantt, top10] =
        await Promise.all([
          api.get(`/credit-score?user_id=${user_id}`),
          api.get(`/payables/summary?user_id=${user_id}`),
          api.get(`/receivables/summary?user_id=${user_id}`),
          api.get(`/balance?user_id=${user_id}`),
          api.get(`/payables/timeline?user_id=${user_id}`),
          api.get(`/payables/top10?user_id=${user_id}`),
        ]);

      setSummary({
        credit_score: credit.data.credit_score,
        payables: payables.data.total_amount,
        receivables: receivables.data.total_amount,
        balance: balance.data.balance,
      });

      setTimeline(gantt.data);
      setTable(top10.data);
    }

    fetchData();
  }, []);

  return (
    <div style={{ padding: "30px" }}>
      <h1>Dashboard</h1>

      <SummaryRow data={summary} />
      <GanttTimeline data={timeline} />
      <PayablesTable data={table} />
    </div>
  );
}