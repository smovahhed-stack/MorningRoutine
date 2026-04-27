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
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysToMonday);
  monday.setHours(0, 0, 0, 0);
  const weekStartEpoch = Math.floor(monday.getTime() / 1000);
  const activitiesRes = await fetch("https://www.strava.com/api/v3/athlete/activities?per_page=50&after=" + weekStartEpoch, { headers: { Authorization: "Bearer " + accessToken } });
  const activities = await activitiesRes.json();
  const runs = activities.filter(a => a.type === "Run").length;
  const lifts = activities.filter(a => a.type === "WeightTraining" || a.type === "Workout" || a.type === "Pilates").length;
  res.redirect("/?runs=" + runs + "&lifts=" + lifts + "&connected=true");
}