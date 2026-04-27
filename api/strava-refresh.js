module.exports = async function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  const tokenRes = await fetch(supabaseUrl + '/rest/v1/strava_tokens?id=eq.1', { headers: { 'apikey': supabaseKey, 'Authorization': 'Bearer ' + supabaseKey } });
  const tokens = await tokenRes.json();
  if (!tokens || tokens.length === 0) { return res.json({ error: 'No token found' }); }
  let { access_token, refresh_token, expires_at } = tokens[0];
  if (expires_at < Math.floor(new Date().getTime() / 1000)) {
    const refreshRes = await fetch('https://www.strava.com/oauth/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, refresh_token, grant_type: 'refresh_token' }) });
    const refreshData = await refreshRes.json();
    access_token = refreshData.access_token;
    refresh_token = refreshData.refresh_token;
    expires_at = refreshData.expires_at;
    await fetch(supabaseUrl + '/rest/v1/strava_tokens?id=eq.1', { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'apikey': supabaseKey, 'Authorization': 'Bearer ' + supabaseKey }, body: JSON.stringify({ access_token, refresh_token, expires_at }) });
  }
  const ms = 7 * 24 * 60 * 60 * 1000;
  const sevenDaysAgo = Math.floor((new Date().getTime() - ms) / 1000);
  const activitiesRes = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=50&after=' + sevenDaysAgo, { headers: { Authorization: 'Bearer ' + access_token } });
  const activities = await activitiesRes.json();
  const now = new Date();
  const today = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');
  const workedOutToday = activities.some(a => a.start_date_local.slice(0, 10) === today && a.type !== 'Walk') ? 1 : 0;
  const runs = activities.filter(a => a.type === 'Run').length;
  const lifts = activities.filter(a => a.type === 'WeightTraining' || a.type === 'Workout' || a.type === 'Pilates').length;
  res.json({ workedOutToday, runs, lifts });
}