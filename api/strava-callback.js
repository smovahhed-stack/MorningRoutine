module.exports = async function handler(req, res) {
  const { code } = req.query;
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  const tokenRes = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, grant_type: 'authorization_code' }),
  });
  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;
  const refreshToken = tokenData.refresh_token;
  const expiresAt = tokenData.expires_at;

  await fetch(supabaseUrl + '/rest/v1/strava_tokens', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': 'Bearer ' + supabaseKey,
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify({ id: 1, access_token: accessToken, refresh_token: refreshToken, expires_at: expiresAt }),
  });

  const ms = 7 * 24 * 60 * 60 * 1000;
  const sevenDaysAgo = Math.floor((new Date().getTime() - ms) / 1000);
  const activitiesRes = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=50&after=' + sevenDaysAgo, { headers: { Authorization: 'Bearer ' + accessToken } });
  const activities = await activitiesRes.json();
  const now = new Date();
  const today = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');
  const workedOutToday = activities.some(a => a.start_date_local.slice(0, 10) === today && a.type !== 'Walk') ? 1 : 0;
  const runs = activities.filter(a => a.type === 'Run').length;
  const lifts = activities.filter(a => a.type === 'WeightTraining' || a.type === 'Workout' || a.type === 'Pilates').length;
  res.redirect('/?today=' + workedOutToday + '&runs=' + runs + '&lifts=' + lifts + '&connected=true');
}