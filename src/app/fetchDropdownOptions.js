// fetchDropdownOptions.js
// Simulate fetching dropdown options from a database
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);



export async function fetchDropdownOptionsFromSupabase() {
  // Get current time and window
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const windowStart = nowMinutes - 20;
  const windowEnd = nowMinutes + 20;

  // Query all appointments for today
  const { data, error } = await supabase
    .from('appointments')
    .select('id, appointment_date, appointment_time, first_name, phone, service')
    .eq('appointment_date', today);
  if (error) return [];

  // Filter by time window
  const filtered = data.filter(row => {
    const [h, m] = row.appointment_time.split(':');
    const mins = parseInt(h, 10) * 60 + parseInt(m, 10);
    return mins >= windowStart && mins <= windowEnd;
  });

  // Map to dropdown format
  return filtered.map(row => ({
    value: row.id,
    label: `${row.first_name} ${row.phone} ${row.service}`,
    first_name: row.first_name,
    phone: row.phone,
    service: row.service
  }));
}
