module.exports = async function handler(req, res) {
  const { code } = req.query;
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  const tokenRes = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, grant_type: "authorization_code" }),
  });
  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;
  const sevenDaysAgo = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
  const res2 = await fetch("https://www.strava.com/api/v3/athlete/activities?per_page=50&after=" + sevenDaysAgo, { headers: { Authorization: "Bearer " + accessToken } });
  const activities = await res2.json();
  const today = new Date().toISOString().slice(0, 10);
  const workedOutToday = activities.some(a => a.start_date_local.slice(0, 10) === today) ? 1 : 0;
  const runs = activities.filter(a => a.type === "Run").length;
  const lifts = activities.filter(a => a.type === "WeightTraining" || a.type === "Workout" || a.type === "Pilates").length;
  res.redirect("/?today=" + workedOutToday + "&runs=" + runs + "&lifts=" + lifts + "&connected=true");
}